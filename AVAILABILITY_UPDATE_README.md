# Responder Availability Update System

## Overview

This document describes the responder availability update system that allows approved responders to update their availability status, which is crucial for incident assignment routing.

## Features

### 1. Availability Status Options
- **Available**: Responder is ready to receive new incidents
- **Busy**: Responder is currently handling incidents but may be available soon
- **Unavailable**: Responder is not available for any incidents

### 2. User Interface
- **Dashboard Header**: Availability status is prominently displayed in the responder dashboard header
- **Profile Page**: Availability status can also be updated from the responder profile page
- **Visual Indicators**: Color-coded status badges with icons for easy identification
- **Real-time Updates**: Status changes are reflected immediately in the UI

### 3. Backend Integration
- **Firebase Function**: `updateResponderAvailability` handles all availability updates
- **Automatic Incident Reassignment**: When a responder becomes unavailable, pending incidents are automatically reassigned
- **Data Consistency**: Both `isAvailable` (boolean) and `availabilityStatus` (string) fields are updated

## Implementation Details

### Frontend Components

#### 1. AvailabilityStatus Component
**Location**: `frontend/src/components/Responder/AvailabilityStatus.jsx`

A reusable component that provides:
- Dropdown interface for status selection
- Visual status indicators with icons
- Error handling and user feedback
- Loading states during updates

**Props**:
- `currentStatus`: Current availability status
- `onStatusChange`: Callback function for status changes
- `disabled`: Whether the component is disabled
- `showLabel`: Whether to show the status label
- `className`: Additional CSS classes

#### 2. ResponderDashboard
**Location**: `frontend/src/pages/ResponderDashboard.jsx`

Integrates the AvailabilityStatus component in the dashboard header for easy access.

#### 3. ResponderProfile
**Location**: `frontend/src/components/Responder/ResponderProfile.jsx`

Includes the AvailabilityStatus component in a dedicated section for profile management.

### Backend Services

#### 1. Firebase Function
**Location**: `functions/responders/updateAvailability.js`

**Features**:
- Authentication and authorization checks
- Input validation for both boolean and string status formats
- Automatic incident reassignment when responders become unavailable
- Notification creation for reassigned incidents
- Comprehensive error handling

#### 2. Frontend Service
**Location**: `frontend/src/services/responderService.js`

**Functions**:
- `updateResponderAvailability()`: Calls the Firebase function
- `updateAvailabilityStatus()`: Direct Firestore updates (fallback)
- `getResponderAvailability()`: Retrieves current availability status

## Data Flow

1. **User Action**: Responder clicks "Update Availability" button
2. **Frontend**: AvailabilityStatus component calls `updateResponderAvailability()`
3. **Service Layer**: Frontend service calls Firebase function
4. **Backend**: Firebase function validates and updates responder data
5. **Incident Management**: If responder becomes unavailable, pending incidents are reassigned
6. **Response**: Success/error message returned to frontend
7. **UI Update**: Status is updated in the interface

## Security Considerations

- Only authenticated users can update availability
- Only approved responders can update their availability
- Input validation prevents malicious data
- Proper error handling prevents information leakage

## Error Handling

- Network errors are caught and displayed to users
- Invalid status values are rejected
- Unauthorized access attempts are blocked
- Database errors are logged and handled gracefully

## Testing

The system includes:
- Input validation testing
- Authentication testing
- Error handling testing
- UI component testing

## Future Enhancements

Potential improvements:
- Location-based availability updates
- Scheduled availability (set future availability)
- Availability history tracking
- Bulk availability updates for admins
- Integration with calendar systems

## Usage Examples

### Basic Usage
```jsx
<AvailabilityStatus
  currentStatus="available"
  onStatusChange={(newStatus, isAvailable) => {
    console.log('Status changed to:', newStatus);
  }}
/>
```

### With Custom Styling
```jsx
<AvailabilityStatus
  currentStatus="busy"
  onStatusChange={handleStatusChange}
  className="my-custom-class"
  showLabel={false}
/>
```

## Troubleshooting

### Common Issues

1. **Status not updating**: Check if user is authenticated and approved
2. **Function not found**: Ensure Firebase function is deployed
3. **UI not reflecting changes**: Check network connectivity and error messages
4. **Incidents not reassigning**: Verify responder approval status

### Debug Steps

1. Check browser console for errors
2. Verify Firebase function logs
3. Confirm user authentication status
4. Validate responder approval status
5. Check Firestore rules and permissions 