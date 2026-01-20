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
  target?: User;
  assignee?: User;
  app?: App;
  doer: Doer;
}) {
  if (!app || !target) return;

  // Get the user's LDAP DN from their custom data
  const userDN = target.custom?.ldap?.dn as string;
  if (!userDN) {
    throw new Error(
      "User LDAP DN not found in user.custom.ldap.dn - user may not exist in LDAP"
    );
  }

  // Remove the user from the LDAP group (baseDN points to the group)
  await zygon.ldap.modify({
    appInstanceId: app.id,
    modifications: [
      {
        operation: "delete",
        type: "member",
        values: [userDN],
      },
    ],
  });

  // Update the account status in Zygon
  const account = await zygon.account.getFirst({
    appInstanceId: app.id,
    collaboratorId: target.id,
  });
  if (account) {
    await zygon.account.update({
      id: account.id,
      status: "suspended",
    });
  }

  await zygon.task.update({
    id: task.id,
    status: "Done",
  });
}