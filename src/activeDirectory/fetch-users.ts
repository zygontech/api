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

  // Iterate over Active Directory user entries
  // AD uses 'user' objectClass and 'objectCategory=person' for user accounts
  for await (const entry of zygon.ldap.list({
    appInstanceId: app.id,
    filter:
      "(&(objectClass=user)(objectCategory=person)(!(objectClass=computer)))",
    attributes: [
      "mail",
      "cn",
      "sAMAccountName",
      "userPrincipalName",
      "memberOf",
      "userAccountControl",
    ],
  })) {
    // AD users may have mail, userPrincipalName, or sAMAccountName as identifier
    const email = entry.attributes.mail as string;
    if (!email) continue;

    // Check if account is disabled (bit 2 of userAccountControl)
    const uac = entry.attributes.userAccountControl as number;
    const isDisabled = uac ? (uac & 2) !== 0 : false;

    const user = await zygon.user.getOrCreate({ primaryEmail: email });

    // Store AD DN and sAMAccountName in user.custom for deprovisioning
    const custom = user.custom || {};
    await zygon.user.update({
      id: user.id,
      custom: JSON.stringify({
        ...custom,
        activeDirectory: {
          ...custom.activeDirectory,
          dn: entry.dn,
          sAMAccountName: entry.attributes.sAMAccountName,
        },
      }),
    });

    const account = await zygon.account.upsert({
      appInstanceId: app.id,
      collaboratorId: user.id,
    });

    // If AD account is disabled, mark as suspended in Zygon
    if (isDisabled) {
      await zygon.account.update({
        id: account.id,
        status: "suspended",
      });
    }

    seen.add(account.id);
  }

  // Mark accounts not found in AD as notExisting
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
