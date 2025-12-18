# BarberLink - Premium Barber Shop Directory for Johannesburg

A modern, Airbnb-style platform connecting clients with verified barber shops in Johannesburg, South Africa.

## Features

- **Airbnb-inspired UI**: Clean, modern interface with card-based listings
- **Location-focused**: Specifically designed for Johannesburg areas (Sandton, Rosebank, Braamfontein, etc.)
- **Two-sided marketplace**: Separate experiences for clients and barber shop owners
- **Verification system**: Blue checkmark badges for verified businesses
- **Review system**: 5-star ratings and comments for credibility
- **Professional design**: Roboto typography, high-contrast aesthetics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with custom Airbnb Red (#FF5A5F) theme
- **Backend**: Supabase (Auth, Database, Storage)
- **Icons**: Lucide React
- **Validation**: Zod schemas
- **Typography**: Google Fonts (Roboto)

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

3. **Environment variables**:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Database Schema

### Tables
- **profiles**: Extended user information with role-based access
- **shops**: Barber shop listings with verification status
- **reviews**: Client reviews and ratings for shops

### Key Features
- Row Level Security (RLS) enabled
- Role-based permissions (client/vendor)
- Automatic profile creation on signup
- Optimized indexes for performance

## User Flows

### Client Experience
1. Browse shops without authentication
2. Sign up/login to save favorites and leave reviews
3. Search by JHB location and service type
4. View shop details with manager information

### Vendor Experience
1. Sign up as a vendor
2. Access dashboard to manage shop listings
3. Add shop details, images, and manager information
4. Track verification status

## Design System

- **Colors**: Airbnb Red (#FF5A5F), Gold accents, high-contrast black/white
- **Typography**: Roboto (300, 400, 500, 700 weights)
- **Icons**: Lucide React (rounded style)
- **Layout**: Responsive grid system, mobile-first approach

## Deployment

The application is ready for deployment on Vercel or any Next.js-compatible platform. Ensure environment variables are properly configured in your deployment environment.