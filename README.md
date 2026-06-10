# School Management System

A professional, full-featured School Management System built with Next.js 16, TypeScript, Tailwind CSS, and React. This system provides comprehensive tools for managing all aspects of a school including students, teachers, attendance, exams, fees, and more.

## Features

### Core Features
- **Dashboard**: Real-time overview of school statistics and quick links to main modules
- **Student Management**: Add, edit, and manage student information and records
- **Teacher Management**: Manage teacher details, subjects, and qualifications
- **Staff Management**: Track staff members and their departments
- **Attendance System**: Digital attendance tracking for students
- **Exam Management**: Create and manage exams, schedules, and routines
- **Fee Management**: Track student fees and payment status
- **Class Management**: Organize classes, sections, and capacity
- **Permission-Based Access Control**: Role-based navigation and permissions
- **Multi-Language Support**: Full support for English and Bengali
- **Dark Mode**: Complete dark mode support with theme persistence
- **Responsive Design**: Mobile-friendly interface that works on all devices

### Architecture & Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui with Lucide icons
- **Internationalization**: next-intl (English & Bengali)
- **State Management**: React Context API
- **Authentication**: Mock auth system with role-based access
- **API**: Mock in-memory API routes for demonstration

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── [locale]/
│   │   └── dashboard/
│   │       ├── students/
│   │       ├── teachers/
│   │       ├── staff/
│   │       ├── attendance/
│   │       ├── exams/
│   │       ├── fees/
│   │       └── settings/
│   ├── api/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── staff/
│   │   └── [other entities]/
│   └── page.tsx (redirects to dashboard)
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── dashboard-layout.tsx
│   ├── common/
│   │   ├── permission-guard.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── language-switcher.tsx
│   │   └── page-header.tsx
│   ├── cards/
│   │   ├── stat-card.tsx
│   │   └── module-card.tsx
│   ├── data-table/
│   │   └── data-table.tsx
│   ├── crud/
│   │   └── crud-page-layout.tsx
│   └── states/
│       ├── empty-state.tsx
│       └── loading-state.tsx
├── lib/
│   ├── auth/
│   │   ├── context.tsx
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── theme/
│   │   └── context.tsx
│   ├── config/
│   │   └── sidebar-config.ts
│   ├── mock-data/
│   │   └── index.ts
│   └── api-utils.ts
├── messages/
│   ├── en.json
│   └── bn.json
└── i18n/
    └── request.ts
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

1. Navigate to the project directory:
```bash
cd /vercel/share/v0-project
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

The application will automatically redirect to the English dashboard at `/en/dashboard`.

## Usage

### Navigating the Application

1. **Dashboard**: Home page with statistics and quick links
2. **Sidebar Navigation**: Click on menu items to access different modules
3. **Language Switcher**: Switch between English (EN) and Bengali (বাংলা) in the topbar
4. **Theme Toggle**: Click the moon/sun icon to toggle dark mode
5. **User Menu**: View current user role and profile information

### Managing Data

Each module includes full CRUD operations:
- **Create**: Click the "Add" button to create new records
- **Read**: View records in the data table
- **Update**: Click the edit icon to modify records
- **Delete**: Click the delete icon to remove records

### Permissions

The application includes role-based access control. Currently logged in as SUPER_ADMIN with all permissions. The permission system supports:
- `student.view`, `student.create`, `student.edit`, `student.delete`
- `teacher.view`, `teacher.create`, `teacher.edit`, `teacher.delete`
- `staff.view`, `staff.create`, `staff.edit`, `staff.delete`
- And many more module-specific permissions

## API Routes

All API routes are mock routes using in-memory data storage. The structure follows RESTful conventions:

### Endpoints

- `GET /api/students` - List all students
- `POST /api/students` - Create a new student
- `GET /api/students/[id]` - Get student by ID
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

Similar patterns exist for: `teachers`, `staff`, `classes`, `exams`, `attendance`, `fees`

### Response Format

```json
{
  "success": true,
  "data": [...],
  "message": "Operation completed successfully"
}
```

## Customization

### Adding New Modules

1. Create a new API route in `app/api/[entity]/route.ts`
2. Add the entity to `lib/mock-data/index.ts`
3. Create a permission in `lib/auth/constants.ts`
4. Create a page in `app/[locale]/dashboard/[entity]/page.tsx`
5. Add sidebar configuration in `lib/config/sidebar-config.ts`
6. Add translations in `messages/en.json` and `messages/bn.json`

### Modifying Sidebar

Edit `lib/config/sidebar-config.ts` to add/remove menu items and customize the navigation structure.

### Styling

The application uses Tailwind CSS v4 with CSS variables defined in `app/globals.css`. Modify color tokens and design tokens there to customize the theme globally.

### Translations

Update `messages/en.json` and `messages/bn.json` to add or modify UI text.

## Features Included

### User Experience
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode with localStorage persistence
- ✅ Multi-language support (English & Bengali)
- ✅ Smooth navigation and transitions
- ✅ Loading states and empty states
- ✅ Role-based access control

### Components
- ✅ Reusable data table
- ✅ CRUD page layout
- ✅ Permission guard component
- ✅ Stat and module cards
- ✅ Sidebar navigation with collapsible menus
- ✅ Topbar with user menu and settings
- ✅ Theme toggle and language switcher

### Admin Features
- ✅ Dashboard with statistics
- ✅ Settings pages (Roles, Permissions, Theme)
- ✅ Mock data management
- ✅ Permission-based navigation

## Future Enhancements

The application is ready for the following enhancements:
1. **Real Database Integration**: Replace mock data with actual database (PostgreSQL, MongoDB, etc.)
2. **Real Authentication**: Implement actual user authentication and session management
3. **File Uploads**: Support for student photos, documents, and attachments
4. **Advanced Reporting**: Generate PDF reports and analytics
5. **Email Notifications**: Send emails to students, parents, and staff
6. **Mobile App**: Extend to React Native or Flutter
7. **Real-time Updates**: WebSocket integration for live updates
8. **Advanced Search**: Full-text search across all modules
9. **Audit Logs**: Track all user actions
10. **Integration APIs**: Connect with external systems

## Performance Optimizations

- ✅ Code splitting with Next.js dynamic imports
- ✅ Tailwind CSS purging unused styles
- ✅ React strict mode for development
- ✅ TypeScript for type safety
- ✅ CSS variables for efficient theming

## Contributing

This is a demonstration project. For production use, consider:
1. Adding comprehensive error handling
2. Implementing input validation
3. Adding unit and integration tests
4. Setting up CI/CD pipeline
5. Adding monitoring and logging
6. Implementing rate limiting and security headers

## License

This project is provided as-is for educational and demonstration purposes.

## Support

For issues or questions about the School Management System:
1. Check the project structure and existing implementations
2. Review the component documentation in the code
3. Check the API route examples
4. Review the mock data structure

## Deployment

To deploy to production:

1. **Build the application**:
```bash
pnpm build
```

2. **Deploy to Vercel**:
```bash
vercel deploy
```

Or use any other Next.js hosting platform (Netlify, AWS Amplify, etc.).

---

**Built with v0** - Professional School Management System for Modern Educational Institutions
