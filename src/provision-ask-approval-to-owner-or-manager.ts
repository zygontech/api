export async function process({
  zygon,
  account,
  user,
}: {
  zygon: Zygon;
  account: Account;
  user: User;
}) {
  const owners = await zygon.app.getOwners({ appId: account.appInstanceId });
  const primaryOwner = owners.find((o) => o.order === 0)?.owner;

  const approvers = [];

  // User's direct manager
  if (user.zygonManagerId) {
    const manager = await zygon.user.getFirst({ id: user.zygonManagerId });
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
    await zygon.account.update({
      id: account.id,
      status: "notExisting",
    });

    await zygon.user.notify({
      userIds: [account.collaboratorId],
      subject: "Access request automatically denied",
      message: "No active approvers available. Please contact IT support.",
    });

    return {
      approved: false,
      reason: "No active approvers available",
    };
  }

  // Create task
  const task = await zygon.task.create({
    status: "Pending",
    type: "CreateAppAccount",
    appInstanceId: account.appInstanceId,
    targetId: account.collaboratorId,
    assigneeId: approvers[0].id,
    roles: account.roles,
  });

  // Request approval from all available approvers (race condition)
  const approvalPromises = approvers.map((approver) =>
    zygon.approval.ask({
      approverId: approver.id,
      todoId: task.id,
    }),
  );

  // Wait for FIRST response (approval or denial)
  const approval = await Promise.race(approvalPromises);

  const app = await zygon.app.getFirst({ id: account.appInstanceId });
  if (!app) return;

  const approver = await zygon.user.getFirst({ id: approval.approverId });
  if (!approver) return;

  const approverRole = approvers.find(
    (a) => a.id === approval.approverId,
  )?.role;

  if (approval.status === "Denied") {
    // Reject the account
    await zygon.account.update({
      id: account.id,
      status: "notExisting",
    });

    // Notify user about denial
    await zygon.user.notify({
      userIds: [account.collaboratorId],
      subject: `Access request denied by ${approver.fullName} (${approverRole})`,
      message: `Your request for ${account.roles.join(", ")} in ${app.name} has been denied.`,
    });

    return {
      approved: false,
      deniedBy: `${approver.fullName} - ${approver.primaryEmail}`,
      deniedByRole: approverRole,
    };
  }

  // If we reach here, it was validated
  return {
    approved: true,
    approvedBy: approval.approverId,
    approverRole,
  };
}
