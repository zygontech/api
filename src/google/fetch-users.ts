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
  await zygon.google.crawlUsers({
    appInstanceId: app.id,
  });
}
