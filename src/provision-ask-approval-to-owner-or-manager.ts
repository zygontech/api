export async function process({
  zygon,
  task,
  target,
  assignee,
  app,
  doer,
}: {
  zygon: Zygon;
  task: Task;
  target: User;
  assignee: User;
  app: App;
  doer: Doer;
}) {
  const owners = await zygon.app.getOwners({ appId: app.id });
  const primaryOwner = owners.find((o) => o.order === 0)?.owner;

  const approvers = [];

  // User's direct manager
  if (target.zygonManagerId) {
    const manager = await zygon.user.getFirst({ id: target.zygonManagerId });
    if (manager && manager.status === "active") {
      approvers.push({
        id: manager.id,
        name: manager.fullName,
        role: "Manager",
      });
    }
  }

  // App primary owner
  if (primaryOwner && primaryOwner.status === "active") {
    approvers.push({
      id: primaryOwner.id,
      name: primaryOwner.fullName,
      role: "App Owner",
    });
  }

  // If no approvers, auto-deny
  if (approvers.length === 0) {
    await zygon.user.notify({
      userIds: [target.id],
      subject: "Access request automatically denied",
      message: "No active approvers available. Please contact IT support.",
    });

    return {
      approved: false,
      reason: "No active approvers available",
    };
  }

  // Request approval from all available approvers (race condition)
  const approvalPromises = approvers.map((approver) =>
    zygon.approval.ask({
      approverId: approver.id,
      todoId: task.id,
    }),
  );

  // Wait for FIRST response (approval or denial)
  const approval = await Promise.race(approvalPromises);

  const approver = await zygon.user.getFirst({ id: approval.approverId });
  if (!approver) return;

  const approverRole = approvers.find(
    (a) => a.id === approval.approverId,
  )?.role;

  if (approval.status === "Denied") {
    // Notify user about denial
    await zygon.user.notify({
      userIds: [target.id],
      subject: `Access request denied by ${approver.fullName} (${approverRole})`,
      message: `Your request for ${task.roles.join(", ")} in ${app.name} has been denied.`,
    });

    return {
      approved: false,
      deniedBy: `${approver.fullName} - ${approver.primaryEmail}`,
      deniedByRole: approverRole,
    };
  }

  // If we reach here, it was validated
  const { appInstanceId, targetId } = task;

  if (!appInstanceId || !targetId) return;

  await zygon.account.upsert({
    appInstanceId,
    collaboratorId: targetId,
    status: "active",
  });

  return {
    approved: true,
    approvedBy: approval.approverId,
    approverRole,
  };
}
