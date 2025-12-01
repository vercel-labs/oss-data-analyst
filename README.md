# oss-data-analyst - Open Source AI Data Science Agent [Reference Architecture]

oss-data-analyst is an intelligent AI agent that converts natural language questions into SQL queries and provides data analysis. Built with the Vercel AI SDK, it features multi-phase reasoning (planning, building, execution, reporting) and streams results in real-time.

> **Note**: This is a fork of the original [vercel-labs/oss-data-analyst](https://github.com/vercel-labs/oss-data-analyst) template with modifications to make it more suitable for demonstration purposes. Key changes include:
>
> - **Emphasis on local databases**: Optimized for SQLite-based demos without requiring cloud database setup
> - **Prompt engineering improvements**: Enhanced system prompts for better query understanding and result interpretation
> - **Streamlined setup**: Simplified configuration and dependencies for quick local deployment

> **Note**: This is a reference architecture. The semantic catalog and schemas included are simplified examples for demonstration purposes. Production implementations should use your own data models and schemas.

## Features

- **Multi-Phase AI Agent**: Planning → Building → Execution → Reporting workflow
- **Real-time Streaming**: Live updates during query processing
- **Smart Data Analysis**: Automated insights and visualizations
- **SQL Validation**: Syntax checking and security policy enforcement
- **Natural Language**: Ask questions in plain English
- **Modern UI**: Built with Next.js, React, and TailwindCSS
- **Extensible Tools**: Easy to add custom tools and capabilitiets

## Quick Start

### Prerequisites

- Node.js 20.19.3+
- pnpm 8.15.0+
- AI Gateway API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/vercel/oss-data-analyst.git
   cd oss-data-analyst
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.local.example .env.local
   ```

   Edit `.env.local` and add your Vercel AI Gateway key

4. **Initialize the database**

   ```bash
   pnpm initDatabase
   ```

   This creates a SQLite database with sample data (Companies, People, Accounts)

5. **Run the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm start
```

## Sample Schema

This repository includes a sample database schema with three main entities to demonstrate oss-data-analyst's capabilities:

### **Companies**

Represents organizations in your database. Each company has:

- Basic information (name, industry, employee count)
- Business metrics (founded date, status)
- Example: Technology companies, Healthcare organizations, etc.

### **Accounts**

Represents customer accounts or subscriptions tied to companies. Each account includes:

- Account identification (account number, status)
- Financial metrics (monthly recurring value, contract details)
- Relationship to parent company
- Example: Active subscriptions with monthly values ranging from $10k-$50k

### **People**

Represents individual employees or contacts within companies. Each person has:

- Personal information (name, email)
- Employment details (department, title, salary)
- Relationship to their company
- Example: Engineers, Sales representatives, Managers across different departments

## How It Works

oss-data-analyst uses a multi-phase agentic workflow:

1. **Planning Phase**

   - Analyzes natural language query
   - Searches semantic catalog for relevant entities
   - Identifies required data and relationships
   - Generates execution plan

2. **Building Phase**

   - Constructs SQL query from plan
   - Validates syntax and security policies
   - Optimizes query structure
   - Finds join paths between tables

3. **Execution Phase**

   - Estimates query cost
   - Executes SQL against database
   - Handles errors with automatic repair
   - Streams results

4. **Reporting Phase**
   - Formats query results
   - Generates visualizations (charts, tables)
   - Provides natural language explanations
   - Performs sanity checks on data

## Extending oss-data-analyst

### Customizing Prompts

Modify system prompts in `src/lib/prompts/`:

- `planning.ts` - Planning phase behavior
- `building.ts` - SQL generation logic
- `execution.ts` - Query execution handling
- `reporting.ts` - Results interpretation

## Example Queries

Try asking oss-data-analyst (using the sample database):

- "How many companies are in the Technology industry?"
- "What is the average salary by department?"
- "Show me the top 5 accounts by monthly value"
- "Which companies have the most employees?"
- "What is the total revenue for Active accounts?"
- "How many people work in Engineering?"

## Using with Your Own Data

The application uses SQLite as its database. To use your own data:

1. Modify the database seed script at `scripts/seed-database.ts` with your data
2. Run `pnpm initDatabase` to reinitialize the database
3. Update the semantic catalog in `src/semantic/` with your schema definitions matching your data structure

## Troubleshooting

**Database Not Found**

- Run `pnpm initDatabase` to create and seed the database
- Check that `data/oss-data-analyst.db` exists

**AI Gateway API Errors**

- Verify your API key is valid in `.env.local`
- Check API rate limits and credits

**Build Errors**

- Run `pnpm install` to update dependencies
- Check TypeScript errors with `pnpm run type-check`
- Clear `.next` folder and rebuild
