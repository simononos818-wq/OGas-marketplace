# OGas Marketplace - Firestore Database Schema

## Overview
This document defines the complete Firestore database structure for the OGas multi-vendor LPG marketplace platform. All collections and subcollections are listed with their fields and data types.

---

## Core Collections

### 1. **users**
Stores customer user information and preferences.

```
Collection: users
├── Document ID: {userId from Firebase Auth}
├── Fields:
│   ├── email: string (user's email)
│   ├── displayName: string (user's full name)
│   ├── phone: string (user's phone number)
│   ├── address: string (delivery address)
│   ├── latitude: number (GPS coordinate)
│   ├── longitude: number (GPS coordinate)
│   ├── profileImage: string (URL to profile image)
│   ├── totalOrders: number (count of completed orders)
│   ├── totalSpent: number (total money spent)
│   ├── averageRating: number (customer rating, 1-5)
│   ├── notificationsEnabled: boolean
│   ├── preferredPaymentMethod: string ('card' | 'ussd' | 'bank' | 'mobilemoney')
│   ├── loyaltyPoints: number (accumulated points)
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── deletedAt: timestamp (null if active)
```

### 2. **sellers**
Stores seller/vendor information and commission details.

```
Collection: sellers
├── Document ID: {auto-generated}
├── Fields:
│   ├── userId: string (Firebase Auth user ID)
│   ├── businessName: string
│   ├── businessEmail: string
│   ├── businessPhone: string
│   ├── sellerType: string ('distributor' | 'dealer' | 'retailer')
│   ├── location: {
│   │   ├── address: string
│   │   ├── latitude: number
│   │   ├── longitude: number
│   │   └── city: string
│   │ }
│   ├── verification: {
│   │   ├── status: string ('pending' | 'verified' | 'rejected')
│   │   ├── cacNumber: string (company registration)
│   │   ├── cacDocument: string (URL to CAC certificate)
│   │   ├── safetyCompliance: boolean
│   │   ├── safetyDocuments: [array of URLs]
│   │   └── verifiedAt: timestamp
│   │ }
│   ├── commissionRate: number (0.02 | 0.03 | 0.05)
│   ├── bankAccount: {
│   │   ├── accountName: string
│   │   ├── accountNumber: string
│   │   ├── bankName: string
│   │   └── verifiedAt: timestamp
│   │ }
│   ├── subscription: {
│   │   ├── status: string ('trial' | 'active' | 'inactive')
│   │   ├── tier: string ('basic' | 'premium')
│   │   ├── startDate: timestamp
│   │   ├── endDate: timestamp
│   │   ├── monthlyFee: number
│   │   └── autoRenew: boolean
│   │ }
│   ├── totalEarnings: number
│   ├── totalOrders: number
│   ├── averageRating: number
│   ├── responseTime: number (avg response time in minutes)
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── deletedAt: timestamp (null if active)
```

### 3. **seller_products**
Product listings created by sellers for the marketplace.

```
Collection: seller_products
├── Document ID: {auto-generated}
├── Fields:
│   ├── sellerId: string (reference to sellers.id)
│   ├── sellerName: string (cache for fast queries)
│   ├── sellerType: string ('distributor' | 'dealer' | 'retailer')
│   ├── productId: string (product template ID)
│   ├── productName: string ('12kg Gas Cylinder', etc.)
│   ├── category: string
│   ├── size: string ('6kg' | '12kg' | '25kg' | '50kg')
│   ├── price: number (seller's price)
│   ├── minPrice: number (minimum allowed price for category)
│   ├── maxPrice: number (maximum allowed price for category)
│   ├── deliveryFee: number
│   ├── deliveryTime: string ('2-4 hours', etc.)
│   ├── stock: number (available quantity)
│   ├── totalSales: number
│   ├── totalRevenue: number
│   ├── totalEarnings: number
│   ├── rating: number (product-specific rating)
│   ├── ratingCount: number
│   ├── description: string
│   ├── images: [array of URLs]
│   ├── discount: number (percentage off)
│   ├── discountEndDate: timestamp (null if no active discount)
│   ├── active: boolean
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── deletedAt: timestamp (null if active)
```

### 4. **orders**
Customer orders across all sellers.

```
Collection: orders
├── Document ID: {auto-generated}
├── Fields:
│   ├── orderId: string (e.g., 'ORD-10024')
│   ├── userId: string (customer ID)
│   ├── customerEmail: string
│   ├── customerPhone: string
│   ├── customerName: string
│   ├── sellerId: string
│   ├── sellerName: string
│   ├── sellerType: string
│   ├── productId: string
│   ├── productName: string
│   ├── quantity: number
│   ├── unitPrice: number
│   ├── subtotal: number
│   ├── deliveryFee: number
│   ├── discount: number (amount, not percentage)
│   ├── tax: number
│   ├── total: number (subtotal + delivery - discount + tax)
│   ├── commission: number (amount earned by seller)
│   ├── commissionRate: number (percentage)
│   ├── paymentMethod: string ('card' | 'ussd' | 'bank' | 'mobilemoney')
│   ├── paymentStatus: string ('pending' | 'completed' | 'failed' | 'refunded')
│   ├── paymentReference: string (Paystack/payment gateway ref)
│   ├── orderStatus: string ('pending' | 'accepted' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled')
│   ├── deliveryAddress: string
│   ├── deliveryLatitude: number
│   ├── deliveryLongitude: number
│   ├── deliveryInstructions: string
│   ├── deliveryType: string ('doorstep' | 'pickup' | 'exchange')
│   ├── assignedDriver: {
│   │   ├── driverId: string
│   │   ├── driverName: string
│   │   ├── driverPhone: string
│   │   └── driverRating: number
│   │ }
│   ├── deliveryStartTime: timestamp
│   ├── estimatedDeliveryTime: timestamp
│   ├── actualDeliveryTime: timestamp
│   ├── timeline: [
│   │   {
│   │     status: string
│   │     timestamp: timestamp
│   │     notes: string
│   │   }
│   │ ]
│   ├── rating: {
│   │   ├── product: number (1-5)
│   │   ├── seller: number (1-5)
│   │   ├── delivery: number (1-5)
│   │   ├── comment: string
│   │   ├── ratedAt: timestamp
│   │ }
│   ├── refundRequest: {
│   │   ├── requestedAt: timestamp
│   │   ├── reason: string
│   │   ├── status: string ('pending' | 'approved' | 'rejected')
│   │   ├── refundAmount: number
│   │   ├── processedAt: timestamp
│   │ }
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── deletedAt: timestamp (null if active)
```

### 5. **deliveries**
Real-time delivery tracking information.

```
Collection: deliveries
├── Document ID: {auto-generated}
├── Fields:
│   ├── deliveryId: string (e.g., 'DEL-10024')
│   ├── orderId: string
│   ├── driverId: string
│   ├── driverName: string
│   ├── driverPhone: string
│   ├── driverRating: number
│   ├── pickupLocation: {
│   │   ├── address: string
│   │   ├── latitude: number
│   │   ├── longitude: number
│   │ }
│   ├── destination: {
│   │   ├── address: string
│   │   ├── latitude: number
│   │   ├── longitude: number
│   │ }
│   ├── currentLocation: {
│   │   ├── latitude: number
│   │   ├── longitude: number
│   │   ├── accuracy: number
│   │   ├── timestamp: timestamp
│   │ }
│   ├── status: string ('pending' | 'accepted' | 'arrived_pickup' | 'in_transit' | 'arrived_destination' | 'delivered')
│   ├── distance: number (meters remaining)
│   ├── estimatedArrival: number (minutes)
│   ├── lastLocationUpdate: timestamp
│   ├── startTime: timestamp
│   ├── endTime: timestamp
│   ├── temperature: number (if temperature-sensitive delivery)
│   └── notes: string
```

### 6. **location_history**
Historical GPS data for delivery analytics and verification.

```
Collection: location_history
├── Document ID: {auto-generated}
├── Fields:
│   ├── deliveryId: string
│   ├── driverId: string
│   ├── location: {
│   │   ├── latitude: number
│   │   ├── longitude: number
│   │ }
│   ├── speed: number (km/h)
│   ├── accuracy: number
│   ├── timestamp: timestamp
│   └── createdAt: timestamp
```

### 7. **refill_reminders**
Customer refill reminder subscriptions.

```
Collection: refill_reminders
├── Document ID: {auto-generated}
├── Fields:
│   ├── userId: string
│   ├── productId: string
│   ├── productName: string
│   ├── lastPurchaseDate: timestamp
│   ├── averageDaysUsage: number (e.g., 60 for 12kg)
│   ├── nextRemindDate: timestamp
│   ├── reminderDaysOffset: number (0.85 * averageDaysUsage)
│   ├── subscriptionEndpoint: string (Web Push API endpoint)
│   ├── enabled: boolean
│   ├── sent: boolean (reminder already sent?)
│   ├── sentAt: timestamp
│   ├── updatedAt: timestamp
│   ├── createdAt: timestamp
│   └── deletedAt: timestamp
```

### 8. **notifications**
Push notification records and delivery tracking.

```
Collection: notifications
├── Document ID: {auto-generated}
├── Fields:
│   ├── userId: string
│   ├── type: string ('refill_reminder' | 'order_update' | 'delivery' | 'promotion')
│   ├── title: string
│   ├── message: string
│   ├── icon: string (URL)
│   ├── action: {
│   │   ├── type: string ('order' | 'track' | 'review')
│   │   ├── url: string
│   │ }
│   ├── read: boolean
│   ├── deliveredAt: timestamp
│   ├── readAt: timestamp
│   ├── createdAt: timestamp
│   └── deletedAt: timestamp
```

### 9. **transactions**
Complete transaction ledger for commission tracking and accounting.

```
Collection: transactions
├── Document ID: {auto-generated}
├── Fields:
│   ├── orderId: string
│   ├── sellerId: string
│   ├── sellerName: string
│   ├── sellerType: string
│   ├── orderAmount: number
│   ├── commission: number
│   ├── commissionRate: number
│   ├── orderDetails: {
│   │   ├── products: [
│   │   │   {
│   │   │     name: string
│   │   │     quantity: number
│   │   │     unitPrice: number
│   │   │   }
│   │   │ ]
│   │   └── deliveryFee: number
│   │ }
│   ├── status: string ('credited' | 'pending' | 'disputed' | 'refunded')
│   ├── createdAt: timestamp
│   ├── processedAt: timestamp
│   └── deletedAt: timestamp
```

### 10. **payment_methods**
Saved payment methods for customers.

```
Collection: payment_methods
├── Document ID: {auto-generated}
├── Fields:
│   ├── userId: string
│   ├── type: string ('card' | 'bank' | 'ussd')
│   ├── isDefault: boolean
│   ├── cardDetails: {
│   │   ├── last4: string
│   │   ├── brand: string ('visa' | 'mastercard')
│   │   ├── expiryMonth: number
│   │   ├── expiryYear: number
│   │   └── authorizationUrl: string (for recurring)
│   │ }
│   ├── bankDetails: {
│   │   ├── bankName: string
│   │   ├── accountNumber: string
│   │   └── accountName: string
│   │ }
│   ├── ussdCode: string (USSD shortcode, e.g., *737*50*)
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── deletedAt: timestamp
```

### 11. **loyalty_accounts**
Loyalty program accounts and point tracking.

```
Collection: loyalty_accounts
├── Document ID: {auto-generated}
├── Fields:
│   ├── userId: string
│   ├── totalPoints: number
│   ├── pointsHistory: [
│   │   {
│   │     orderId: string
│   │     points: number (positive or negative)
│   │     type: string ('purchase' | 'referral' | 'redemption')
│   │     timestamp: timestamp
│   │   }
│   │ ]
│   ├── tier: string ('bronze' | 'silver' | 'gold' | 'platinum')
│   ├── tierUpgradedAt: timestamp
│   ├── nextTierPoints: number (points needed for next tier)
│   ├── redeemableAmount: number (points * conversion rate)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 12. **partnerships**
Strategic partnership records (suppliers, logistics, government).

```
Collection: partnerships
├── Document ID: {auto-generated}
├── Fields:
│   ├── name: string (e.g., 'NIPCO', 'Oando Gas')
│   ├── category: string ('supplier' | 'logistics' | 'regulatory' | 'government')
│   ├── status: string ('interested' | 'negotiating' | 'active' | 'completed')
│   ├── contactPerson: string
│   ├── email: string
│   ├── phone: string
│   ├── benefits: string (partnership value description)
│   ├── potentialValue: number (estimated annual value in Naira)
│   ├── keyMetrics: {
│   │   ├── volume: number (units/month)
│   │   ├── revenue: number (monthly revenue)
│   │   └── margin: number (profit margin %)
│   │ }
│   ├── startDate: timestamp
│   ├── endDate: timestamp
│   ├── notes: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### 13. **promotions**
Active promotional campaigns.

```
Collection: promotions
├── Document ID: {auto-generated}
├── Fields:
│   ├── title: string
│   ├── description: string
│   ├── type: string ('percentage' | 'fixed' | 'bogo' | 'freeShipping')
│   ├── discountValue: number
│   ├── startDate: timestamp
│   ├── endDate: timestamp
│   ├── minOrderAmount: number
│   ├── maxDiscountAmount: number
│   ├── applicableProductIds: [array of strings]
│   ├── applicableSellerTypes: [array of 'distributor' | 'dealer' | 'retailer']
│   ├── usageLimit: number (max times coupon can be used)
│   ├── usagePerCustomer: number
│   ├── code: string (promotion code if applicable)
│   ├── active: boolean
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

---

## Indexes Required

For optimal query performance, create the following composite indexes:

1. **seller_products**
   - `sellerType + price + createdAt`
   - `category + active + price`
   - `sellerId + active + createdAt`

2. **orders**
   - `userId + createdAt (descending)`
   - `sellerId + orderStatus + createdAt`
   - `paymentStatus + orderStatus + createdAt`

3. **deliveries**
   - `driverId + status + createdAt`
   - `orderId + status`

4. **transactions**
   - `sellerId + status + createdAt`
   - `sellerType + createdAt (descending)`

5. **refill_reminders**
   - `userId + enabled + nextRemindDate`
   - `nextRemindDate + enabled`

---

## API Response Patterns

### Commission Calculation Example
```javascript
/**
 * POST /api/commissions/calculate
 * Request:
 * {
 *   orderId: "ORD-10024",
 *   sellerId: "seller-001",
 *   orderAmount: 4000,
 *   status: "completed"
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     transactionId: "trans-10001",
 *     orderId: "ORD-10024",
 *     seller: {
 *       id: "seller-001",
 *       name: "NIPCO Distribution",
 *       type: "distributor"
 *     },
 *     orderAmount: 4000,
 *     commission: 210,  // 5.25% after platform fee
 *     commissionRate: "5.25%",
 *     status: "credited"
 *   }
 * }
 */
```

### Delivery Tracking Example
```javascript
/**
 * POST /api/delivery/update-location
 * Request:
 * {
 *   deliveryId: "DEL-10024",
 *   driverId: "driver-001",
 *   currentLocation: {
 *     lat: 6.5244,
 *     lng: 3.3792
 *   },
 *   speed: 25,
 *   accuracy: 5
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     deliveryId: "DEL-10024",
 *     location: { lat: 6.5244, lng: 3.3792 },
 *     estimatedArrival: 12  // minutes
 *   }
 * }
 */
```

---

## Data Retention Policy

- **Orders**: Keep indefinitely (for history and disputes)
- **Location History**: 6 months (then archive)
- **Notifications**: 30 days
- **Transactions**: Keep indefinitely (accounting requirement)
- **Deleted Records**: Soft delete with `deletedAt` timestamp, hard delete after 90 days

---

## Security Rules Summary

- Users can only read/write their own data
- Sellers can only modify their own products and orders
- Admin can access all collections
- Commission calculations are server-side only
- Payment data encrypted at rest