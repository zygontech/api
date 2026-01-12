/*
 * @param {Zygon} zygon - access to the Zygon API
 */
export async function process({ zygon }: { zygon: Zygon }) {
  await zygon.fetch({
    url: "",
    options: {
      method: "POST",
      body: {},
    },
  });
}
