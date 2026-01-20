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

  // Retrieve the LDAP DN from user.custom
  const ldapData = target.custom?.ldap;
  if (!ldapData?.dn) {
    throw new Error(
      "LDAP DN not found in user.custom.ldap - user may not have been synced from LDAP",
    );
  }

  // Delete the LDAP entry
  await zygon.ldap.delete({
    appInstanceId: app.id,
    dn: ldapData.dn,
  });

  // Clear the LDAP data from user.custom
  const custom = target.custom || {};
  delete custom.ldap;
  await zygon.user.update({
    id: target.id,
    custom: JSON.stringify(custom),
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
