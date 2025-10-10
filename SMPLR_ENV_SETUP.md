# Smplrspace Environment Setup

## Add these to your .env file (frontend or backend):

```env
# Smplrspace Configuration
NEXT_PUBLIC_SMPLR_CLIENT_TOKEN=pub_85fb8c47bad24dc1a81deacf6e7555c4
NEXT_PUBLIC_SMPLR_ORG_ID=a6e4ff78-7bf8-46e6-b36a-d24c2b325535
NEXT_PUBLIC_SMPLR_DEFAULT_SPACE_ID=spc_r8ni5bft
```

## Your Smplrspace Details:
- **Organization ID**: a6e4ff78-7bf8-46e6-b36a-d24c2b325535
- **Client Token**: pub_85fb8c47bad24dc1a81deacf6e7555c4
- **Space ID**: spc_r8ni5bft

## Authorized Domains:
You may need to add `localhost:3000` to your authorized domains in the Smplrspace dashboard.

## Usage:
1. Add the environment variables above to your `.env` file
2. Restart your development server
3. Access the floor plan canvas at `http://localhost:3000/floor-plans/canvas`
