/*
 * @param {Zygon} zygon - access to the Zygon API
 * @param {App} app - Details of the matched app
 * @param {Doer} doer - Details of the doer
 */
export async function process({
  zygon,
  app,
}: {
  zygon: Zygon;
  app: App;
  doer: Doer;
}) {
  const seen: Set<string> = new Set();

  // Iterate over LDAP entries matching the filter
  for await (const entry of zygon.ldap.list({
    appInstanceId: app.id,
    filter: "(objectClass=person)",
    attributes: ["mail", "cn", "uid", "memberOf"],
  })) {
    const email = entry.attributes.mail as string;
    if (!email) continue;

    const user = await zygon.user.getOrCreate({ primaryEmail: email });

    // Store LDAP DN in user.custom for deprovisioning
    const custom = user.custom || {};
    await zygon.user.update({
      id: user.id,
      custom: JSON.stringify({
        ...custom,
        ldap: { ...custom.ldap, dn: entry.dn },
      }),
    });

    const account = await zygon.account.upsert({
      appInstanceId: app.id,
      collaboratorId: user.id,
    });

    seen.add(account.id);
  }

  // Mark accounts not found in LDAP as notExisting
  for await (const account of zygon.account.list({
    appInstanceId: app.id,
  })) {
    if (seen.has(account.id)) continue;
    await zygon.account.update({
      id: account.id,
      status: "notExisting",
    });
  }
}
