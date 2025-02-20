from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic()
response = client.messages.create(
    model="claude-3-haiku-20240307",
    messages=[{"role": "user", "content":"Multiply 1984135 by 9343116."}],
    max_tokens=400
)
print(response.content[0].text)




