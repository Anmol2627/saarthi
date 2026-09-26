"""
SAARTHI - Sarvam API Connection Test
Minimal test to verify Sarvam API key and chat completion work.

Usage:
  1. Set SARVAM_API_KEY in .env file
  2. Run: python test_sarvam.py
"""

import os
import sys

# Load .env file
from dotenv import load_dotenv
load_dotenv()

# Read API key from environment — NEVER hardcode
api_key = os.getenv("SARVAM_API_KEY")

if not api_key or api_key.strip() == "":
    print("ERROR: SARVAM_API_KEY is not set.")
    print("Please add your API key to the .env file:")
    print('  SARVAM_API_KEY=your_key_here')
    print()
    print("Get your key from: https://dashboard.sarvam.ai/")
    sys.exit(1)

# Initialize Sarvam client
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key=api_key)

# Make a single chat completion call using sarvam-105b-conversations
print("Calling Sarvam API (sarvam-105b-conversations)...")
print()

response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "user", "content": "Namaste! Briefly introduce yourself in Hinglish."}
    ],
)

# Print only the model response
print(response.choices[0].message.content)
