import wikipedia
from anthropic import Anthropic
from dotenv import load_dotenv
load_dotenv()
client = Anthropic()

tool_schema = {
    "name": "generate_wikipedia_reading_list",
    "description": "Generates a list of appropriate wikipedia articles",
    "input_schema": {
        "type": "object",
        "properties": {
            "research_topic": {
                "type": "string",
                "description": "The given wikipedia topic to research",
            },
            "article_titles": {
                "type": "array",
                "items": {
                    "type": "string",
                },
                "description": "A list of generated article titles"
            }
        },
        "required": ["research_topic", "article_titles"],
    },
}


def generate_wikipedia_reading_list(research_topic, article_titles):
    wikipedia_articles = []
    for t in article_titles:
        results = wikipedia.search(t)
        try:
            page = wikipedia.page(results[0])
            title = page.title
            url = page.url
            wikipedia_articles.append({"title": title, "url": url})
        except:
            continue
    add_to_research_reading_file(wikipedia_articles, research_topic)


def add_to_research_reading_file(articles, topic):
    with open("output/research_reading.md", "a", encoding="utf-8") as file:
        file.write(f"## {topic} \n")
        for article in articles:
            title = article["title"]
            url = article["url"]
            file.write(f"* [{title}]({url}) \n")
        file.write(f"\n\n")


def get_research_help():
    messages = [{
        "role": "user",
        "content": "I need help in researching about the current POTUS where I need 4 articles on it"
    }]
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        system="Call the appropriate functions",
        messages=messages,
        max_tokens=500,
        tools=[tool_schema],
    )
    print(response)
    topic = response.content[1].input['research_topic']
    titles = response.content[1].input['article_titles']
    function_name = response.content[1].name
    if function_name:
        generate_wikipedia_reading_list(topic, titles)

get_research_help()