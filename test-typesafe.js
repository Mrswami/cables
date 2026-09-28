import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

async function run() {
  try {
    console.log("Connecting to TypeSafe AI...");
    const response = await client.systemOne({
      state: { document: "Hello, TypeSafe! This is a test." },
      questions: {
        category: choice("Is this a test?", {
          yes: null,
          no: null,
        }),
      },
    });

    console.log("Success! Response from Jev model:");
    console.log(JSON.stringify(response.answers, null, 2));
  } catch (error) {
    console.error("Failed to connect or fetch from TypeSafe AI:");
    console.error(error);
  }
}

run();
