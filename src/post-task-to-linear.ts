export async function process({ zygon, task }: { zygon: Zygon; task: Task }) {
  const linearApiKey = await zygon.variable.getByName({ name: "linearApiKey" }); // Linear API key from Settings > API
  const linearTeamId = await zygon.variable.getByName({ name: "linearTeamId" }); // Team UUID

  if (!linearApiKey.value || !linearTeamId.value) {
    throw new Error("Missing one or more required Linear secrets");
  }

  const query = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      teamId: linearTeamId.value,
      title: task.title || `Zygon Task ${task.id}`,
      description:
        task.description ||
        `Created automatically from Zygon workflow.\nTask type: ${task.type}\nStatus: ${task.status}`,
      labelIds: [],
      priority: 2,
    },
  };

  const response = await zygon.fetch({
    url: "https://api.linear.app/graphql",
    options: {
      method: "POST",
      headers: {
        Authorization: linearApiKey.value,
        "Content-Type": "application/json",
      },
      body: {
        query,
        variables,
      },
    },
  });

  if (!response.ok) {
    throw new Error(
      `Linear issue creation failed with status ${response.status}: ${response.statusText}`,
    );
  }
}
