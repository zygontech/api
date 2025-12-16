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

  const approvers: any = {
    manager: null,
    appOwner: null,
  };

  // User's direct manager
  if (target.zygonManagerId) {
    const manager = await zygon.user.getFirst({ id: target.zygonManagerId });
    if (manager && manager.status === "active") {
      approvers.manager = {
        id: manager.id,
        name: manager.fullName,
        email: manager.primaryEmail,
      };
    }
  }

  // App primary owner
  if (primaryOwner && primaryOwner.status === "active") {
    approvers.appOwner = {
      id: primaryOwner.id,
      name: primaryOwner.fullName,
      email: primaryOwner.primaryEmail,
    };
  }

  // If either approver is missing, auto-deny
  if (!approvers.manager || !approvers.appOwner) {
    const missingApprover = !approvers.manager ? "manager" : "app owner";

    await zygon.user.notify({
      userIds: [target.id],
      subject: "Access request automatically denied",
      message: `No active ${missingApprover} available for approval. Please contact IT support.`,
    });

    return {
      approved: false,
      reason: `No active ${missingApprover} available`,
    };
  }

  // Request approval from BOTH manager and app owner simultaneously
  // Workflow suspends and waits for BOTH to respond
  const [managerApproval, ownerApproval] = await Promise.all([
    zygon.approval.ask({
      approverId: approvers.manager.id,
      todoId: task.id,
    }),
    zygon.approval.ask({
      approverId: approvers.appOwner.id,
      todoId: task.id,
    }),
  ]);

  // Check if EITHER denied
  const deniedApproval = [managerApproval, ownerApproval].find(
    (a) => a.status === "Denied",
  );

  if (deniedApproval) {
    const denier =
      deniedApproval.approverId === approvers.manager.id
        ? approvers.manager
        : approvers.appOwner;
    const denierRole =
      deniedApproval.approverId === approvers.manager.id
        ? "Manager"
        : "App Owner";

    // Notify user about denial
    await zygon.user.notify({
      userIds: [target.id],
      subject: `Access request denied by ${denier.name} (${denierRole})`,
      message: `Your request for ${task.roles.join(", ")} in ${app.name} has been denied.`,
    });

    return {
      approved: false,
      deniedBy: `${denier.name} - ${denier.email}`,
      deniedByRole: denierRole,
      managerApproval: managerApproval.status,
      appOwnerApproval: ownerApproval.status,
    };
  }

  // BOTH approved - activate account
  await zygon.user.notify({
    userIds: [target.id],
    subject: "Access request approved",
    message: `Your request for ${task.roles.join(", ")} in ${app.name} has been approved by both your manager and the app owner.`,
  });

  const { appInstanceId, targetId } = task;

  if (!appInstanceId || !targetId) return;

  await zygon.account.upsert({
    appInstanceId,
    collaboratorId: targetId,
    status: "active",
  });

  return {
    approved: true,
    managerApproval: {
      approvedBy: approvers.manager.name,
      email: approvers.manager.email,
    },
    appOwnerApproval: {
      approvedBy: approvers.appOwner.name,
      email: approvers.appOwner.email,
    },
  };
}
