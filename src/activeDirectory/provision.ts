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

  // Generate a unique sAMAccountName (max 20 chars for AD)
  const { value: samSuffix } = await zygon.helpers.generateString({
    length: 8,
    lowercase: true,
    digits: true,
  });

  // Build sAMAccountName from email prefix + random suffix
  const emailPrefix = target.primaryEmail.split("@")[0].slice(0, 10);
  const sAMAccountName = `${emailPrefix}${samSuffix}`.slice(0, 20);

  // Build the DN for the new user entry
  const baseDN = "CN=Users,DC=example,DC=com"; // Adjust to your AD structure
  const cn = target.fullName || target.primaryEmail.split("@")[0];
  const dn = `CN=${cn},${baseDN}`;

  // Create the AD user entry
  await zygon.ldap.add({
    appInstanceId: app.id,
    dn,
    attributes: {
      objectClass: ["top", "person", "organizationalPerson", "user"],
      cn,
      sAMAccountName,
      userPrincipalName: target.primaryEmail,
      mail: target.primaryEmail,
      displayName: target.fullName || target.primaryEmail,
      // userAccountControl: 512 = Normal account, enabled
      userAccountControl: 512,
    },
  });

  // Store the DN and sAMAccountName in user.custom for future deprovisioning
  const custom = target.custom || {};
  await zygon.user.update({
    id: target.id,
    custom: JSON.stringify({
      ...custom,
      activeDirectory: {
        ...custom.activeDirectory,
        dn,
        sAMAccountName,
      },
    }),
  });

  // Create the account in Zygon
  await zygon.account.upsert({
    appInstanceId: app.id,
    collaboratorId: target.id,
  });

  await zygon.task.update({
    id: task.id,
    status: "Done",
  });
}
