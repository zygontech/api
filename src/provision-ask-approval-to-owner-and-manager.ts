export async function process({ account }: { account: Account }) {
  // Get user and app details
  const user = await zygon.user.getById({ id: account.collaboratorId });
  const owners = await zygon.app.getOwners({ appId: account.appInstanceId });
  const primaryOwner = owners.find((o) => o.order === 0)?.owner;

  const approvers: any = {
    manager: null,
    appOwner: null,
  };

  // User's direct manager
  if (user.zygonManagerId) {
    const manager = await zygon.user.getById({ id: user.zygonManagerId });
    if (manager.status === "active") {
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
    await zygon.account.update({
      id: account.id,
      status: "notExisting",
    });

    const missingApprover = !approvers.manager ? "manager" : "app owner";

    await zygon.user.notify({
      userIds: [account.collaboratorId],
      subject: "Access request automatically denied",
      message: `No active ${missingApprover} available for approval. Please contact IT support.`,
    });

    return {
      approved: false,
      reason: `No active ${missingApprover} available`,
    };
  }

  // Create task
  const task = await zygon.task.create({
    status: "Pending",
    type: "CreateAppAccount",
    appInstanceId: account.appInstanceId,
    targetId: account.collaboratorId,
    assigneeId: approvers.appOwner.id,
    roles: account.roles,
  });

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

  const app = await zygon.app.getById({ id: account.appInstanceId });

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

    // Reject the account
    await zygon.account.update({
      id: account.id,
      status: "notExisting",
    });

    // Notify user about denial
    await zygon.user.notify({
      userIds: [account.collaboratorId],
      subject: `Access request denied by ${denier.name} (${denierRole})`,
      message: `Your request for ${account.roles.join(", ")} in ${app.name} has been denied.`,
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
    userIds: [account.collaboratorId],
    subject: "Access request approved",
    message: `Your request for ${account.roles.join(", ")} in ${app.name} has been approved by both your manager and the app owner.`,
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
