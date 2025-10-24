export async function process({ user }: { user: User }) {
  // Stop here if the user has no Lucca ID
  if (!user.luccaUserId) return;

  // Fetch user data from Lucca
  const luccaUser = await zygon.lucca.getUser({
    luccaUserId: user.luccaUserId.toString(),
    fields: ["dtContractEnd", "extendedData"],
  });

  // Convert contract start and end dates to JavaScript Date objects
  const contractEndDate = luccaUser.dtContractEnd
    ? new Date(luccaUser.dtContractEnd)
    : null;

  // Get the custom field "last day worked" if it exists
  const lastDayWorked = luccaUser.extendedData?.["e_Last-day-worked"]?.value;

  // Update the user record in Zygon with the new data
  await zygon.user.update({
    id: user.id,
    workEndDate: lastDayWorked ? new Date(lastDayWorked) : contractEndDate,
  });
}
