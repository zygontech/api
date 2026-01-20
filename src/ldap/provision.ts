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

  // Generate a unique uid with lowercase letters and digits
  const { value: uid } = await zygon.helpers.generateString({
    length: 12,
    lowercase: true,
    digits: true,
  });

  // Build the DN for the new user entry
  const baseDN = "ou=users,dc=example,dc=com"; // Adjust to your LDAP structure
  const dn = `uid=${uid},${baseDN}`;

  // Create the LDAP entry
  await zygon.ldap.add({
    appInstanceId: app.id,
    dn,
    attributes: {
      objectClass: ["inetOrgPerson", "organizationalPerson", "person", "top"],
      cn: target.fullName || target.primaryEmail,
      sn: "N/A",
      mail: target.primaryEmail,
      uid,
    },
  });

  // Store the DN in user.custom for future deprovisioning
  const custom = target.custom || {};
  await zygon.user.update({
    id: target.id,
    custom: JSON.stringify({
      ...custom,
      ldap: { ...custom.ldap, dn },
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
