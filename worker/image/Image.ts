import type { ImageAPIParam, Env } from "../types";

export default async function handleImageRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const param: ImageAPIParam = (await request.json()) as ImageAPIParam;
  const prompt = param.prompt

  const response = await env.AI.run(
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    {
      prompt: prompt
    }
  );

  return new Response(response, {
    headers: {
      "content-type": "image/png",
    },
  });
}