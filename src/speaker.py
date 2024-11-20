import os
import time

import pygame
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def text_to_speech(text, model="tts-1", voice="onyx", filename="output.mp3"):
    try:
        with client.audio.speech.with_streaming_response.create(
            model=model,
            voice=voice,
            input=text
        ) as response:
            response.stream_to_file(filename)
            #print(f"Audio file saved as {filename}")

        while True:
            try:
                with open(filename, 'rb'):
                    break
            except IOError:
                print(f"File {filename} is in use, waiting...")
                time.sleep(0.5)

        pygame.mixer.init()
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pass
        print("Audio playback complete.")

    except Exception as e:
        print(f"Error in text_to_speech: {e}")
    finally:
        if pygame.mixer.music.get_busy():
            pygame.mixer.music.stop()

        pygame.mixer.quit()
        time.sleep(1)

        try:
            if os.path.exists(filename):
                os.remove(filename)
                #print(f"Temporary file {filename} removed.")
        except PermissionError:
            print(f"Error: Could not delete {filename}")
        except Exception as e:
            print(f"Error while deleting file: {e}")
