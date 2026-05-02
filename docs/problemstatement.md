## Problem Statement: AI-Powered Restaurant Recommendation System (Zomato-Inspired)

Build an AI-powered restaurant recommendation service inspired by Zomato. The system should generate relevant, personalized recommendations by combining **structured restaurant data** with a **Large Language Model (LLM)**.

## Objective
Design and implement an application that:

- Accepts user preferences (e.g., location, budget, cuisine, rating threshold)
- Uses a real-world restaurant dataset as the source of truth
- Uses an LLM to rank and explain recommendations in natural, human-like language
- Presents results in a clear, user-friendly format

## System Workflow

### 1) Data ingestion
- Load and preprocess the Zomato dataset from Hugging Face: `https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation`
- Extract relevant fields (as available in the dataset), such as:
  - Restaurant name
  - Location / city
  - Cuisine(s)
  - Cost / price range
  - Rating
  - Any other useful metadata

### 2) User input
Collect preferences such as:

- Location (e.g., Delhi, Bangalore)
- Budget (low / medium / high, or a numeric range if you support it)
- Cuisine (e.g., Italian, Chinese)
- Minimum rating
- Additional constraints (e.g., family-friendly, quick service)

### 3) Integration layer (retrieval + prompt preparation)
- Filter the dataset to produce a shortlist that matches user constraints
- Prepare the shortlisted restaurant records in a structured form for the LLM
- Design a prompt that guides the LLM to:
  - Compare options consistently
  - Rank restaurants based on the user’s priorities
  - Avoid inventing facts not present in the dataset

### 4) Recommendation engine (LLM)
Use the LLM to:

- Rank the shortlisted restaurants
- Provide brief explanations for each recommendation (why it matches the user)
- Optionally summarize the overall trade-offs among the top choices

### 5) Output display
Show the top recommendations in a user-friendly format that includes at least:

- Restaurant name
- Cuisine
- Rating
- Estimated cost / price range
- AI-generated explanation