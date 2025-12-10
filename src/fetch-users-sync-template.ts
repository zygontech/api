const emails = ["jon@zygon.tech", "doe@zygon.tech", "guest@zygon.tech"];

export async function process({
  zygon,
  app,
  doer,
}: {
  zygon: Zygon;
  app: App;
  doer: Doer;
}) {
  const seen: Set<string> = new Set();

  for (const email of emails) {
    const collaborator = await zygon.user.getOrCreate({ primaryEmail: email });
    const account = await zygon.account.upsert({
      appInstanceId: app.id,
      collaboratorId: collaborator.id,
    });
    seen.add(account.id);
  }

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
