export async function process({
  zygon,
  account,
  user,
  app,
  doer,
}: {
  zygon: Zygon;
  account: Account;
  user: User;
  app: App;
  doer: Doer;
}) {
  // write your custom logic here to map roles
  const roles = user.role === "admin" ? ["admin"] : ["regular"];
  await zygon.account.update({ id: account.id, roles });
}
