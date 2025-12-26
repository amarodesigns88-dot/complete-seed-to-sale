# Phase 2: Backend Module Expansion - Implementation Plan

## Overview

This document provides a comprehensive implementation plan for Phase 2 of the Revised Seed-to-Sale Complete System. Phase 2 involves updating 6 existing modules and building 9 new modules to support the complete cannabis tracking and regulatory compliance platform.

**Estimated Effort:** 200-300 hours of production-quality development  
**Approach:** Incremental delivery with module-by-module implementation  
**Testing Strategy:** Unit tests for each module, integration tests for workflows

---

## Phase 2 Architecture

### Module Categories

1. **Core Module Updates** (6 modules) - Update existing modules for new schema
2. **Licensee Workflow Modules** (4 modules) - Conversion, Testing, Lab, Enhanced Transfer
3. **State Governance Modules** (4 modules) - State management and oversight
4. **System Administration** (1 module) - Configuration and customization
5. **Reporting** (1 module) - Comprehensive licensee reporting

---

## Implementation Sequence

### Stage 1: Core Module Updates (Weeks 1-3)

Update existing modules to support new Phase 1 schema enhancements.

#### 1.1 Auth Module Enhancement
**Estimated Effort:** 8 hours  
**Priority:** HIGH - Foundation for State User support

**Changes Required:**
- Add State User authentication support
- Implement read-only permission checks
- Add license number pre-selection for Admin users
- Update JWT payload to include user type and accessible UBIs

**New Endpoints:**
- `POST /auth/login/state-user` - State user login
- `POST /auth/login/admin` - Admin login with license pre-selection
- `GET /auth/permissions` - Get user permissions based on role

**DTOs:**
- `StateUserLoginDto` - State user credentials
- `AdminLoginDto` - Admin credentials with optional license number
- `UserPermissionsDto` - User permissions response

**Testing:**
- Unit tests for authentication logic (3-4 tests)
- Integration tests for login flows (2-3 tests)

---

#### 1.2 User Module Enhancement
**Estimated Effort:** 12 hours  
**Priority:** HIGH - Required for multi-role support

**Changes Required:**
- Support multi-role assignment via User-Role many-to-many
- Add user type management (Admin, State, Licensee)
- Implement accessible UBI management for users
- Add permission validation based on roles

**New Endpoints:**
- `POST /users/:id/roles` - Assign roles to user
- `DELETE /users/:id/roles/:roleId` - Remove role from user
- `GET /users/:id/permissions` - Get user effective permissions
- `POST /users/:id/accessible-ubis` - Set accessible UBIs for user
- `GET /users/by-type/:userType` - List users by type

**DTOs:**
- `AssignRoleDto` - Role assignment
- `UserPermissionResponseDto` - User permissions
- `AccessibleUbiDto` - UBI access configuration
- `UserTypeFilterDto` - User type filter

**Testing:**
- Unit tests for role management (5-6 tests)
- Integration tests for permission checks (3-4 tests)

---

#### 1.3 Cultivation Module Enhancement
**Estimated Effort:** 20 hours  
**Priority:** HIGH - Core business functionality

**Changes Required:**
- Implement 3 harvest types (Whole Plant, Regular, Additional Collection)
- Add cure functionality for whole plant harvests
- Support mother plant operations (clone/seed generation)
- Implement destruction with waste logging
- Add undo capabilities for key operations

**New Endpoints:**
- `POST /cultivation/plants/:id/harvest` - Harvest plant (with type)
- `POST /cultivation/plants/:id/cure` - Start cure process
- `POST /cultivation/plants/:id/convert-to-mother` - Convert to mother plant
- `POST /cultivation/plants/:id/generate-clones` - Generate clones from mother
- `POST /cultivation/plants/:id/generate-seeds` - Generate seeds from mother
- `POST /cultivation/plants/:id/destroy` - Destroy plant with waste logging
- `POST /cultivation/plants/:id/move-room` - Move plant to different room
- `POST /cultivation/cures/:id/complete` - Complete cure process
- `POST /cultivation/operations/:id/undo` - Undo operation

**DTOs:**
- `HarvestPlantDto` - Harvest details with type
- `StartCureDto` - Cure initiation
- `GenerateClonesDto` - Clone generation from mother
- `GenerateSeedsDto` - Seed generation from mother
- `DestroyPlantDto` - Destruction with reason
- `MovePlantRoomDto` - Room movement
- `CompleteCureDto` - Cure completion
- `UndoOperationDto` - Undo request

**Business Logic:**
- Validate harvest type rules
- Track mother plant offspring counts
- Create waste inventory items on destruction
- Maintain operation history for undo
- Update room capacities on plant movements

**Testing:**
- Unit tests for harvest types (6-8 tests)
- Unit tests for mother plant operations (4-5 tests)
- Integration tests for destruction workflow (3-4 tests)
- Integration tests for undo operations (3-4 tests)

---

#### 1.4 Inventory Module Enhancement
**Estimated Effort:** 25 hours  
**Priority:** HIGH - Core business functionality

**Changes Required:**
- Support 3 inventory creation methods (Mother Plant, Inbound Transfer, Initial Window)
- Implement room management and movement
- Add inventory adjustments (up/down with red flag warnings)
- Implement inventory split (parent/child with sublot identifiers)
- Implement inventory combination (into existing or new item)
- Add lot creation from wet/dry inventory
- Implement destruction with waste logging
- Add undo capabilities for all operations

**New Endpoints:**
- `POST /inventory/items/from-mother-plant` - Create from mother plant
- `POST /inventory/items/initial-window` - Create during initial window
- `POST /inventory/items/:id/move-room` - Move to different room
- `POST /inventory/items/:id/adjust` - Adjust quantity (with warnings)
- `POST /inventory/items/:id/split` - Split into multiple items
- `POST /inventory/items/combine` - Combine multiple items
- `POST /inventory/lots/create` - Create lot from wet/dry items
- `POST /inventory/items/:id/destroy` - Destroy with waste logging
- `POST /inventory/operations/:id/undo` - Undo operation
- `GET /inventory/adjustments` - List all adjustments
- `GET /inventory/splits` - List all splits
- `GET /inventory/combinations` - List all combinations

**DTOs:**
- `CreateFromMotherPlantDto` - Mother plant creation
- `InitialWindowItemDto` - Initial window creation
- `MoveItemRoomDto` - Room movement
- `AdjustInventoryDto` - Adjustment (with reason)
- `SplitInventoryDto` - Split configuration
- `CombineInventoryDto` - Combination configuration
- `CreateLotDto` - Lot creation from items
- `DestroyInventoryDto` - Destruction with reason

**Business Logic:**
- Validate inventory creation sources
- Update room capacities on movements
- Trigger red flag warnings on large adjustments
- Maintain parent-child relationships for splits
- Generate sublot identifiers for split items
- Validate combination rules (same type, same room)
- Track usable weight for finished goods
- Create waste items on destruction
- Maintain operation history for undo

**Testing:**
- Unit tests for creation methods (6-8 tests)
- Unit tests for adjustments with warnings (5-6 tests)
- Unit tests for split operations (6-7 tests)
- Unit tests for combine operations (5-6 tests)
- Integration tests for lot creation (4-5 tests)
- Integration tests for undo operations (4-5 tests)

---

#### 1.5 Sales/POS Module Enhancement
**Estimated Effort:** 18 hours  
**Priority:** MEDIUM - Customer-facing functionality

**Changes Required:**
- Support 3 sale types (Regular, Pickup with reservation, Delivery with manifest)
- Add loyalty program support
- Implement product customization (pricing, discounts, categories)
- Add patient portal integration for allotment tracking
- Implement void (same day only) and refund capabilities

**New Endpoints:**
- `POST /sales/regular` - Create regular sale
- `POST /sales/pickup` - Create pickup sale with reservation
- `POST /sales/delivery` - Create delivery sale with manifest
- `POST /sales/:id/void` - Void sale (same day only)
- `POST /sales/:id/refund` - Process refund
- `GET /sales/:id/receipt` - Get sale receipt
- `POST /products` - Create/update product
- `GET /products` - List products with filters
- `GET /products/:id/pricing` - Get product pricing
- `POST /loyalty/points/add` - Add loyalty points
- `GET /loyalty/customers/:customerId` - Get customer loyalty info
- `GET /patient-portal/allotment/:patientId` - Get patient allotment

**DTOs:**
- `CreateRegularSaleDto` - Regular sale
- `CreatePickupSaleDto` - Pickup sale with reservation
- `CreateDeliverySaleDto` - Delivery sale with manifest
- `VoidSaleDto` - Void request with reason
- `RefundSaleDto` - Refund request
- `ProductDto` - Product configuration
- `ProductPricingDto` - Pricing and discounts
- `LoyaltyPointsDto` - Loyalty points transaction

**Business Logic:**
- Validate sale types and requirements
- Enforce same-day void rule
- Calculate and apply loyalty points
- Track patient allotment deductions
- Generate delivery manifests
- Update inventory on sale completion
- Reverse inventory on void/refund

**Testing:**
- Unit tests for sale types (6-7 tests)
- Unit tests for void/refund rules (4-5 tests)
- Unit tests for loyalty calculations (3-4 tests)
- Integration tests for complete sale workflows (4-5 tests)

---

#### 1.6 Licensee Module Enhancement
**Estimated Effort:** 8 hours  
**Priority:** MEDIUM - License type integration

**Changes Required:**
- Integrate LicenseType entity
- Support multi-license type assignment
- Add license type validation for module access
- Implement license status management

**New Endpoints:**
- `POST /licensees/:id/license-types` - Assign license type
- `DELETE /licensees/:id/license-types/:typeId` - Remove license type
- `GET /licensees/:id/modules` - Get available modules by license type
- `PUT /licensees/:id/status` - Update license status

**DTOs:**
- `AssignLicenseTypeDto` - License type assignment
- `LicenseTypeModulesDto` - Available modules
- `UpdateLicenseStatusDto` - Status update

**Testing:**
- Unit tests for license type assignment (3-4 tests)
- Integration tests for module access (2-3 tests)

---

### Stage 2: Licensee Workflow Modules (Weeks 4-7)

Build new modules for core licensee workflows.

#### 2.1 Conversion Module (NEW)
**Estimated Effort:** 25 hours  
**Priority:** HIGH - Core processing functionality

**Purpose:** Enable conversions between inventory types with usable weight tracking.

**Features:**
- 3 conversion types: 1-to-1, Many-to-1, Many-to-Many
- Usable weight calculation for finished goods
- Conversion safeguards and warnings
- Track conversion flow: Wet → Dry/Lot/Extraction → Finished Goods
- Undo capability

**Entities Used:**
- Conversion, ConversionInput, ConversionOutput, InventoryItem

**Endpoints:**
- `POST /conversions/one-to-one` - Single item conversion
- `POST /conversions/many-to-one` - Combine multiple to one
- `POST /conversions/many-to-many` - Multiple inputs to multiple outputs
- `GET /conversions` - List conversions with filters
- `GET /conversions/:id` - Get conversion details
- `POST /conversions/:id/undo` - Undo conversion
- `GET /conversions/flow-tracking/:itemId` - Track item conversion history

**DTOs:**
- `OneToOneConversionDto`
- `ManyToOneConversionDto`
- `ManyToManyConversionDto`
- `ConversionInputDto`
- `ConversionOutputDto`
- `UsableWeightCalculationDto`

**Business Logic:**
- Validate conversion rules (type compatibility)
- Calculate weight loss/gain ratios
- Compute usable weight for finished goods
- Update inventory quantities
- Track conversion chain for traceability
- Implement safeguards (warnings for unusual ratios)

**Testing:**
- Unit tests for each conversion type (9-12 tests)
- Integration tests for conversion workflows (5-6 tests)
- Tests for usable weight calculations (4-5 tests)

---

#### 2.2 Transfer Module Enhancement (NEW)
**Estimated Effort:** 30 hours  
**Priority:** HIGH - Critical for multi-location operations

**Purpose:** Enhanced transfer functionality with intake workflow and manifests.

**Features:**
- Alert system (inbound, outbound, received, voided, rejected)
- Item-by-item intake workflow with 3 acceptance options (Accept All, Accept Partial, Reject All)
- Driver and vehicle assignment
- Purchase order and manifest generation
- Transfer test results and COAs with items
- Status tracking and void capability (before receipt only)
- Support 2 transfer types: Sales Transfer, Same UBI Transfer

**Entities Used:**
- Transfer, TransferItem, Driver, Vehicle, TransferDriver, TransferVehicle, Sample, TestResult

**Endpoints:**
- `POST /transfers/outbound` - Create outbound transfer
- `POST /transfers/:id/assign-driver` - Assign driver
- `POST /transfers/:id/assign-vehicle` - Assign vehicle
- `POST /transfers/:id/generate-manifest` - Generate manifest
- `GET /transfers/inbound` - List inbound transfers (alerts)
- `POST /transfers/:id/intake/start` - Start intake process
- `POST /transfers/:id/intake/item/:itemId` - Process single item (accept/partial/reject)
- `POST /transfers/:id/intake/complete` - Complete intake
- `POST /transfers/:id/void` - Void transfer (before receipt)
- `GET /transfers/:id/manifest` - Download manifest
- `GET /transfers/:id/purchase-order` - Download purchase order
- `POST /transfers/:id/attach-test-results` - Attach test results to items

**DTOs:**
- `CreateTransferDto`
- `AssignDriverDto`
- `AssignVehicleDto`
- `IntakeItemDto` (with acceptance option)
- `TransferManifestDto`
- `PurchaseOrderDto`
- `AttachTestResultsDto`

**Business Logic:**
- Generate unique transfer numbers
- Validate driver/vehicle assignments
- Enforce intake workflow (item-by-item processing)
- Handle partial acceptance (adjust quantities)
- Update inventory on receipt
- Track transfer status transitions
- Enforce void rules (only before receipt)
- Generate PDF manifests and purchase orders
- Transfer test results with items

**Testing:**
- Unit tests for transfer creation (5-6 tests)
- Unit tests for intake workflows (8-10 tests)
- Integration tests for complete transfer cycle (5-6 tests)
- Tests for manifest generation (3-4 tests)

---

#### 2.3 Testing Module (NEW)
**Estimated Effort:** 22 hours  
**Priority:** HIGH - Regulatory requirement

**Purpose:** Sample generation and lab assignment for compliance testing.

**Features:**
- Sample extraction from inventory items
- Automatic panel assignment based on inventory type
- Lab assignment and transfer integration
- Detailed status tracking
- Remediation workflow (State request approval)
- Void capability (before lab receipt)

**Entities Used:**
- Sample, TestingPanel, Test, InventoryItem, StateRequest

**Endpoints:**
- `POST /testing/samples/create` - Create sample from inventory
- `GET /testing/samples` - List samples with filters
- `GET /testing/samples/:id` - Get sample details
- `POST /testing/samples/:id/assign-lab` - Assign to lab
- `POST /testing/samples/:id/assign-panels` - Assign test panels
- `POST /testing/samples/:id/transfer-to-lab` - Transfer to lab
- `POST /testing/samples/:id/void` - Void sample (before lab receipt)
- `GET /testing/panels` - List available test panels
- `POST /testing/remediation/request` - Request remediation (State)
- `GET /testing/inventory/:itemId/status` - Get testing status

**DTOs:**
- `CreateSampleDto`
- `AssignLabDto`
- `AssignPanelsDto`
- `TransferSampleDto`
- `RemediationRequestDto`

**Business Logic:**
- Extract sample portion from inventory
- Auto-assign panels based on inventory type
- Track sample through testing lifecycle
- Integrate with transfer module for lab delivery
- Enforce void rules (only before lab receipt)
- Link test results back to inventory
- Handle failed test remediation workflow

**Testing:**
- Unit tests for sample creation (5-6 tests)
- Unit tests for panel assignment (4-5 tests)
- Integration tests for testing workflow (5-6 tests)
- Tests for remediation process (3-4 tests)

---

#### 2.4 Lab Module (NEW)
**Estimated Effort:** 20 hours  
**Priority:** HIGH - Regulatory requirement

**Purpose:** Lab result entry and COA generation.

**Features:**
- Alert system for sample assignment/transfer
- Intake workflow (2 options: Accept All, Reject All)
- Result entry interface
- COA generation and linking to inventory via sample ID

**Entities Used:**
- Sample, TestResult, Test, TestingPanel

**Endpoints:**
- `GET /lab/samples/assigned` - List assigned samples (alerts)
- `POST /lab/samples/:id/intake` - Intake sample (accept/reject)
- `POST /lab/samples/:id/results` - Enter test results
- `POST /lab/samples/:id/coa/generate` - Generate COA
- `GET /lab/samples/:id/coa` - Download COA
- `GET /lab/results/:sampleId` - Get all results for sample
- `PUT /lab/results/:resultId` - Update result

**DTOs:**
- `IntakeSampleDto`
- `EnterResultDto`
- `GenerateCOADto`
- `TestResultDto`

**Business Logic:**
- Handle sample intake (accept or reject all)
- Validate result entry (ranges, units)
- Calculate pass/fail based on thresholds
- Generate PDF COA with all results
- Link results to original inventory item
- Trigger alerts on failed tests

**Testing:**
- Unit tests for result entry (6-7 tests)
- Unit tests for COA generation (3-4 tests)
- Integration tests for lab workflow (4-5 tests)

---

### Stage 3: State Governance Modules (Weeks 8-10)

Build modules for state oversight and licensee management.

#### 3.1 State User Management Module (NEW)
**Estimated Effort:** 12 hours  
**Priority:** MEDIUM - State operations

**Purpose:** Manage state users and their access.

**Endpoints:**
- `POST /state/users` - Create state user
- `GET /state/users` - List state users
- `PUT /state/users/:id` - Update state user
- `DELETE /state/users/:id` - Soft delete state user
- `POST /state/users/:id/permissions` - Set permissions

**DTOs:**
- `CreateStateUserDto`
- `UpdateStateUserDto`
- `StateUserPermissionsDto`

**Testing:**
- Unit tests (4-5 tests)
- Integration tests (2-3 tests)

---

#### 3.2 State Dashboard Module (NEW)
**Estimated Effort:** 18 hours  
**Priority:** MEDIUM - State oversight

**Purpose:** Market overview and red flag detection.

**Features:**
- Market statistics (total licensees, inventory, sales)
- Red flag detection (unusual activity, compliance issues)
- License status overview
- Trend analysis

**Endpoints:**
- `GET /state/dashboard/overview` - Market overview
- `GET /state/dashboard/red-flags` - Active red flags
- `GET /state/dashboard/licensees/statistics` - Licensee statistics
- `GET /state/dashboard/inventory/summary` - Inventory summary
- `GET /state/dashboard/sales/trends` - Sales trends

**DTOs:**
- `MarketOverviewDto`
- `RedFlagDto`
- `LicenseeStatisticsDto`
- `InventorySummaryDto`
- `SalesTrendDto`

**Testing:**
- Unit tests (6-8 tests)
- Integration tests (3-4 tests)

---

#### 3.3 State Licensee Account Management Module (NEW)
**Estimated Effort:** 15 hours  
**Priority:** MEDIUM - State operations

**Purpose:** Create and manage licensee accounts.

**Features:**
- Create new licensees
- Activate/deactivate licenses
- Set initial window for inventory creation
- Assign license types

**Endpoints:**
- `POST /state/licensees` - Create licensee
- `PUT /state/licensees/:id/activate` - Activate license
- `PUT /state/licensees/:id/deactivate` - Deactivate license
- `POST /state/licensees/:id/initial-window` - Set initial window
- `POST /state/licensees/:id/license-types` - Assign license types

**DTOs:**
- `CreateLicenseeDto`
- `SetInitialWindowDto`
- `AssignLicenseTypesDto`

**Testing:**
- Unit tests (5-6 tests)
- Integration tests (3-4 tests)

---

#### 3.4 State Request Approval Module (NEW)
**Estimated Effort:** 12 hours  
**Priority:** MEDIUM - Remediation workflow

**Purpose:** Approve/deny remediation requests from licensees.

**Features:**
- View pending requests
- Approve/deny requests
- Add notes and conditions

**Endpoints:**
- `GET /state/requests/pending` - List pending requests
- `GET /state/requests/:id` - Get request details
- `POST /state/requests/:id/approve` - Approve request
- `POST /state/requests/:id/deny` - Deny request
- `POST /state/requests/:id/notes` - Add notes

**DTOs:**
- `ApproveRequestDto`
- `DenyRequestDto`
- `RequestNoteDto`

**Testing:**
- Unit tests (4-5 tests)
- Integration tests (2-3 tests)

---

#### 3.5 State Reporting Module (NEW)
**Estimated Effort:** 20 hours  
**Priority:** LOW - Advanced features

**Purpose:** Custom report builder for state-wide data.

**Features:**
- Pre-built report templates
- Custom report builder
- Export capabilities (PDF, CSV, Excel)
- Scheduled reports

**Endpoints:**
- `GET /state/reports/templates` - List report templates
- `POST /state/reports/generate` - Generate report
- `POST /state/reports/custom` - Build custom report
- `GET /state/reports/:id/download` - Download report

**DTOs:**
- `ReportTemplateDto`
- `GenerateReportDto`
- `CustomReportDto`

**Testing:**
- Unit tests (6-8 tests)
- Integration tests (3-4 tests)

---

### Stage 4: Administration & Reporting (Weeks 11-12)

#### 4.1 System Admin Module (NEW)
**Estimated Effort:** 25 hours  
**Priority:** LOW - Configuration

**Purpose:** System-wide customization and rules.

**Features:**
- Barcode format customization
- Inventory type customization (add, remove, rename)
- Transfer rules customization (license types, inventory types, testing status)
- Testing rules customization (panels per inventory type)
- Usable weight calculation customization
- Location license type customization

**Endpoints:**
- `GET /admin/config/barcode` - Get barcode config
- `PUT /admin/config/barcode` - Update barcode config
- `GET /admin/inventory-types` - Manage inventory types
- `POST /admin/inventory-types` - Add inventory type
- `PUT /admin/inventory-types/:id` - Update inventory type
- `DELETE /admin/inventory-types/:id` - Remove inventory type
- `GET /admin/transfer-rules` - Get transfer rules
- `PUT /admin/transfer-rules` - Update transfer rules
- `GET /admin/testing-rules` - Get testing rules
- `PUT /admin/testing-rules` - Update testing rules
- `GET /admin/usable-weight-rules` - Get usable weight rules
- `PUT /admin/usable-weight-rules` - Update usable weight rules

**DTOs:**
- `BarcodeConfigDto`
- `InventoryTypeConfigDto`
- `TransferRulesDto`
- `TestingRulesDto`
- `UsableWeightRulesDto`

**Testing:**
- Unit tests (8-10 tests)
- Integration tests (4-5 tests)

---

#### 4.2 Licensee Reporting Module (NEW)
**Estimated Effort:** 18 hours  
**Priority:** MEDIUM - Business intelligence

**Purpose:** Comprehensive reporting for licensee functionality.

**Features:**
- Inventory reports
- Sales reports
- Cultivation reports
- Transfer reports
- Testing reports
- Financial reports
- Export capabilities

**Endpoints:**
- `GET /reports/inventory` - Inventory reports
- `GET /reports/sales` - Sales reports
- `GET /reports/cultivation` - Cultivation reports
- `GET /reports/transfers` - Transfer reports
- `GET /reports/testing` - Testing reports
- `GET /reports/financial` - Financial reports
- `POST /reports/custom` - Custom report
- `GET /reports/:id/export` - Export report

**DTOs:**
- `InventoryReportDto`
- `SalesReportDto`
- `CultivationReportDto`
- `TransferReportDto`
- `TestingReportDto`
- `FinancialReportDto`
- `CustomReportDto`

**Testing:**
- Unit tests (8-10 tests)
- Integration tests (4-5 tests)

---

## Testing Strategy

### Unit Testing
- Each service method has corresponding unit tests
- Mock dependencies using Jest mocking
- Test business logic validation
- Test error handling
- Target: 80%+ code coverage per module

### Integration Testing
- Test complete workflows end-to-end
- Use test database with fixtures
- Test API endpoints with actual HTTP requests
- Validate database state changes
- Test authorization and permissions

### Performance Testing
- Load test critical endpoints (sales, transfers)
- Database query optimization
- Response time benchmarks

---

## Documentation Requirements

### For Each Module:
1. **API Documentation** - Swagger/OpenAPI specs
2. **Service Documentation** - JSDoc comments
3. **Business Logic Documentation** - Workflow diagrams
4. **Integration Guide** - How modules interact
5. **User Guide** - End-user documentation

---

## Delivery Approach

### Incremental Delivery (Recommended)

**Sprint 1 (Week 1):**
- Auth Module Enhancement
- User Module Enhancement
- Testing setup and CI/CD configuration

**Sprint 2 (Week 2):**
- Cultivation Module Enhancement
- Initial unit tests and integration tests

**Sprint 3 (Week 3):**
- Inventory Module Enhancement (Part 1: Creation, Rooms, Adjustments)

**Sprint 4 (Week 4):**
- Inventory Module Enhancement (Part 2: Split, Combine, Lots, Destruction)
- Sales/POS Module Enhancement
- Licensee Module Enhancement

**Sprint 5 (Week 5):**
- Conversion Module (NEW)
- Testing for Conversion workflows

**Sprint 6 (Week 6):**
- Transfer Module Enhancement (NEW)
- Testing for Transfer workflows

**Sprint 7 (Week 7):**
- Testing Module (NEW)
- Lab Module (NEW)
- Integration between Testing and Lab

**Sprint 8 (Week 8):**
- State User Management Module (NEW)
- State Dashboard Module (NEW)

**Sprint 9 (Week 9):**
- State Licensee Account Management Module (NEW)
- State Request Approval Module (NEW)

**Sprint 10 (Week 10):**
- State Reporting Module (NEW)

**Sprint 11 (Week 11):**
- System Admin Module (NEW)

**Sprint 12 (Week 12):**
- Licensee Reporting Module (NEW)
- Final integration testing
- Performance optimization
- Documentation completion

---

## Quality Gates

Each module must pass the following before moving to the next:

1. ✅ All unit tests passing (80%+ coverage)
2. ✅ All integration tests passing
3. ✅ API documentation complete
4. ✅ Code review completed
5. ✅ Security scan passed (no critical vulnerabilities)
6. ✅ Performance benchmarks met

---

## Risk Mitigation

### Technical Risks:
1. **Complex Business Logic** - Break into smaller, testable units
2. **Database Performance** - Add indexes, optimize queries, use caching
3. **Integration Complexity** - Clear interface contracts, comprehensive integration tests
4. **Data Migration** - Careful planning, rollback strategies

### Schedule Risks:
1. **Scope Creep** - Stick to defined requirements, defer enhancements to Phase 3
2. **Dependencies** - Clearly define module dependencies, parallel development where possible
3. **Testing Bottlenecks** - Continuous testing, automated test execution

---

## Success Criteria

Phase 2 is complete when:

✅ All 15 modules (6 updated + 9 new) are implemented  
✅ 150+ API endpoints are functional and documented  
✅ 80%+ test coverage achieved  
✅ All integration tests passing  
✅ Performance benchmarks met  
✅ Security scan shows no critical vulnerabilities  
✅ Documentation complete for all modules  
✅ Ready for Phase 3 (Frontend) integration

---

## Next Steps

1. **Review and Approval** - Stakeholder review of this implementation plan
2. **Resource Allocation** - Assign developers to modules
3. **Sprint Planning** - Detailed sprint planning for Sprint 1
4. **Development Start** - Begin with Auth and User module enhancements

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Status:** Draft - Pending Approval
