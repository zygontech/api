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

  // Retrieve the AD DN from user.custom
  const adData = target.custom?.activeDirectory;
  if (!adData?.dn) {
    throw new Error(
      "Active Directory DN not found in user.custom.activeDirectory - user may not have been synced from AD"
    );
  }

  // Disable the AD account instead of deleting (safer approach for AD)
  // Set userAccountControl bit 2 (ACCOUNTDISABLE)
  await zygon.ldap.modify({
    appInstanceId: app.id,
    dn: adData.dn,
    modifications: [
      {
        operation: "replace",
        type: "userAccountControl",
        values: ["514"], // 512 (normal) + 2 (disabled)
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