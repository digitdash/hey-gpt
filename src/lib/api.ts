import { OpenAIApi, Configuration } from 'openai';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { writeFile } from 'fs';
import { format } from 'date-fns';

const configuration = new Configuration({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const pollyClient = new PollyClient({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    },
});

export async function getChatGPTResponse(prompt: string): Promise<string> {
    const response = await openai.createCompletion({
        model: "gpt-4o",
        prompt,
        max_tokens: 150,
    });
    return response.data.choices[0].text;
}

export async function synthesizeSpeech(text: string): Promise<string> {
    const command = new SynthesizeSpeechCommand({
        OutputFormat: 'mp3',
        Text: text,
        VoiceId: 'Joanna', // or any other Polly voice you prefer
    });

    const { AudioStream } = await pollyClient.send(command);
    const arrayBuffer = await AudioStream.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(audioBlob);
}
export function saveHistory(transcript: string, response: string): void {
    const date = format(new Date(), 'yyyy-MM-dd');
    const data = `Prompt: ${transcript}\nResponse: ${response}\n\n`;
    writeFile(`./history/${date}.txt`, data, { flag: 'a' }, (err) => {
        if (err) console.error('Error saving history:', err);
    });
}
