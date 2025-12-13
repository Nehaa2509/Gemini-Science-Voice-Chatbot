from pathlib import Path
from openai import OpenAPT
import pygame
import time
import os

def text_to_speech(text):

    client = OpenAPT()

    speach_file_path = Path(__file__).parent/"speech2.mp3"
    os.remove(speach_file_path)

    with client.audio.speech.with_streaming_response.create(
        model="tts-1",
        voice="nove",
        input=text,
    ) as response :
        response.stream_to_file(speach_file_path)

    pygame.mixer.init()    
    pygame.mixer.music.load(speach_file_path)    
    pygame.mixer.music.play()    

    # keep your program running  long enough for the audio to play
    while pygame.mixer.music.get_busy():
        time.sleep(1)

    pygame.mixer.quit()    


