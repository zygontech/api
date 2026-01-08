/*
 * @param {Zygon} zygon - access to the Zygon API
 * @param {Task} task - Details of the matched task
 * @param {User} target - Details of the task target
 * @param {User} assignee - Details of the task assignee
 * @param {App} app - Details of the task app
 * @param {Doer} doer - Details of the doer
 */
export async function process({
  zygon,
  task,
  target,
  app,
}: {
  zygon: Zygon;
  task: Task;
  target: User;
  assignee: User;
  app: App;
  doer: Doer;
}) {
  if (!target.zygonManagerId) {
    return {
      approved: false,
      reason: `${target.primaryEmail} has no manager on Zygon`,
    };
  }

  // Get user's direct manager
  const manager = await zygon.user.getFirst({ id: target.zygonManagerId });
  if (!manager || manager.status !== "active") {
    return {
      approved: false,
      reason: `No active user manager available for ${target.primaryEmail}`,
    };
  }

  // Workflow suspends and waits for manager to respond
  const approval = await zygon.approval.ask({
    approverId: manager.id,
    todoId: task.id,
  });

  if (approval.status === "Denied") {
    // Notify user about denial
    await zygon.user.notify({
      userIds: [target.id],
      subject: `Access request denied by ${manager.fullName}`,
      message: `Your request for ${task.roles.join(", ")} in ${app.name} has been denied.`,
    });

    return {
      approved: false,
      deniedBy: `${manager.fullName} - ${manager.primaryEmail}`,
    };
  }

  // Request approveds
  await zygon.user.notify({
    userIds: [target.id],
    subject: "Access request approved",
    message: `Your request for ${task.roles.join(", ")} in ${app.name} has been approved by both your manager.`,
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
    approvedBy: `${manager.fullName} - ${manager.primaryEmail}`,
  };
}
