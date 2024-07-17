<script lang="ts">
    import { onMount } from "svelte";
    import {
        getChatGPTResponse,
        synthesizeSpeech,
        saveHistory,
    } from "../lib/api";

    let listening = false;
    let transcript = "";
    let response = "";
    let audioUrl = "";
    let recognition: SpeechRecognition;

    declare global {
        interface Window {
            webkitSpeechRecognition: typeof SpeechRecognition;
        }

        var webkitSpeechRecognition: {
            new (): SpeechRecognition;
        };
    }

    interface SpeechRecognition {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start(): void;
        stop(): void;
        onresult: (event: SpeechRecognitionEvent) => void;
        onstart: () => void;
        onend: () => void;
    }

    interface SpeechRecognitionEvent {
        results: {
            0: {
                0: {
                    transcript: string;
                };
            };
        };
    }

    onMount(() => {
        if ("webkitSpeechRecognition" in window) {
            recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                transcript = event.results[0][0].transcript;
                getChatGPTResponse(transcript).then((res) => {
                    response = res;
                    saveHistory(transcript, response); // Save the interaction history
                    synthesizeSpeech(res).then((url) => {
                        audioUrl = url;
                        const audio = new Audio(audioUrl);
                        audio.play();
                    });
                });
            };

            recognition.onstart = () => {
                listening = true;
            };

            recognition.onend = () => {
                listening = false;
            };
        }
    });

    function startListening() {
        recognition.start();
    }

    function stopListening() {
        recognition.stop();
    }

    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "Space") {
            startListening();
        }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
        if (event.code === "Space") {
            stopListening();
        }
    });
</script>

<main>
    <h1>HeyGPT</h1>
    <div>
        <span class={listening ? "listening" : ""}>Listening...</span>
    </div>
    <div>
        <h2>Transcript:</h2>
        <p>{transcript}</p>
    </div>
    <div>
        <h2>Response:</h2>
        <p>{response}</p>
    </div>
</main>

<style>
    .listening {
        color: red;
    }
</style>
