Complete system
Define Ground Rules:

BARCODE FORMAT: All items will be tracked via a 16 digit barcode number, this number must never repeat nor duplicate across any location, the ID of the table could be the default one, but within the plants inventory tables there must be a barcode column.
TABLE RELATION: relations between tables should be done via IDs to keep it consistent across the entire system.
We must never hard delete anything, for traceability purposes everything must be soft delete
We must also keep logs of all actions, action name, change, who did it and when it was done.
Cultivation Module will track Plants 
Inventory Module will track Inventory Items
System will consist of a single sign on page
We need to establish a set of Test panels to be used in the testing module, you can use industry standard test panels as default.
Interface design details
IT will be one single interface
Keep all menu options and modules on the left hand side in a panel starting with location information at the tap, followed by the different modules depending on level of access
Add ability to expand or collapse menu panel
When a user clicks on a module on the right hand side it will display module functionality
There is going to be 3 major types of users
Admin user
Can access all module, however when an admin clicks on for example the cultivation module, they would need to preset the license number to access the module
Access into licensee modules must be in read only
State Users
Can access State Module and Licensee modules similar to admin user, access must be in read only
Licensee Users
Can only access Licensee modules within the UBI they have access to.

Default Inventory types:
(What are inventory types - these are the parent category assigned to all inventory types depending on how it is created)
Conversions flow from: -  Wet inventory types → Dry Inventory types/Lot Inventory types/Extraction Inventory Types → Finished Goods.

Source Inventory Types
Clones 
Seeds
Waste Inventory type
Waste
Cannot be used it is only used for logging purposes
Must be destroyed
Wet inventory types (From Harvest)
Wet Flower — Freshly harvested whole flower (wet weight). Unit: grams/kg.
Wet Trim — Fresh trim from harvest (leaves/sugar trim). Unit: grams/kg.
Wet Whole Plant — Whole plant wet biomass (includes stems). Unit: kg.
Fresh Frozen Flower — Immediately frozen flower for extraction. Unit: grams/kg.
Fresh Frozen Trim — Trim frozen post-harvest for extraction. Unit: grams/kg.
Dry Inventory types (From cure)
Dry Flower (Cured) — Dried and cured flower ready for inventory/lots. Unit: grams/kg.
Dry Trim — Dried trim separated from cured flower (for extracts). Unit: grams/kg.
Cured Whole Plant — Cured whole-plant biomass (rare). Unit: kg.
Bucked Flower — Flower removed from stems and cured. Unit: grams/kg.
Smalls/Shake — Loose cured flower pieces and shake. Unit: grams/kg.
Lot Inventory types (From “Create Lot” functionality - which is the combination of wet/dry inventory type items to make lots)
Lot of Wet Flower -  A batch of freshly harvested cannabis flower that has not yet been dried or cured. Unit of Measure (UOM): Pounds (lbs) or Kilograms (kg)
Lot of Dry Flower - A batch of cannabis flower that has been dried and cured, ready for further processing or sale. Unit of Measure (UOM): Pounds (lbs) or Kilograms (kg)
Lot of Trim - A batch of cannabis trim material collected during harvesting, used for extraction or other products. Unit of Measure (UOM): Pounds (lbs) or Kilograms (kg)
Extraction Inventory Types (These are created with “Conversion” functionality from wet,dry,lot inventory types)
Crude Extract (Solvent) — Initial solvent-based crude (ethanol/BHO/CO2). Unit: grams/kg.
Distillate — Refined, high-potency distillate (THC/CBD). Unit: grams/ml.
Winterized Oil — Solvent-extracted oil after winterization. Unit: grams/ml.
Full‑Spectrum Extract — Less-refined extract retaining minor cannabinoids/terpenes. Unit: grams/ml.
Live Resin — Flash-frozen fresh plant extraction preserving terpenes. Unit: grams/ml.
Rosin — Solventless press-extracted concentrate. Unit: grams.
Hash / Kief — Concentrated trichome product (dry sift or collected). Unit: grams.
Isolate (THC/CBD) — Pure cannabinoid isolate (powder or crystalline). Unit: grams.
Resin Sauce / Hybrid Concentrate — High-terpene viscous extract (sauce/badder). Unit: grams.
RSO (Rick Simpson Oil) / Full Extract Oil — Whole-plant, high-fat carrier oil extract. Unit: grams/ml.
Finished Goods - (These are created with “Conversion” functionality from wet,dry,lot inventory,Extraction Inventory types items)
Pre-Rolls
 Description: Pre-rolled cannabis flower joints ready for consumption.
 UOM: Each (ea)
Edibles (Gummies)
 Description: Cannabis-infused gummy candies in various flavors and dosages.
 UOM: Each (ea) or Package
Edibles (Baked Goods)
 Description: Cannabis-infused baked products such as cookies, brownies, or cakes.
 UOM: Each (ea) or Package
Tinctures
 Description: Cannabis extracts in liquid form, administered sublingually via dropper.
 UOM: Milliliters (ml)
Topicals (Creams/Lotions)
 Description: Cannabis-infused creams or lotions applied to the skin for localized relief.
 UOM: Ounces (oz) or Grams (g)
Capsules
 Description: Cannabis oil or powder encapsulated for oral ingestion.
 UOM: Each (ea) or Bottle
Vape Cartridges
 Description: Pre-filled cannabis oil cartridges for use with vape pens.
 UOM: Milliliters (ml)
Beverages
 Description: Cannabis-infused drinks such as sodas, teas, or waters.
 UOM: Each (ea) or Bottle
Concentrate Pens
 Description: Disposable or rechargeable vape pens pre-loaded with cannabis concentrate.
 UOM: Each (ea)
Transdermal Patches
 Description: Adhesive patches delivering cannabinoids through the skin over time.
 UOM: Each (ea)
Suppositories
 Description: Cannabis-infused suppositories for rectal or vaginal administration.
 UOM: Each (ea)
Infused Chocolates
 Description: Cannabis-infused chocolate bars or pieces.
 UOM: Each (ea) or Package
Infused Mints
 Description: Cannabis-infused breath mints or lozenges.
 UOM: Each (ea) or Package
Sublingual Strips
 Description: Thin strips infused with cannabis extract placed under the tongue for fast absorption.
 UOM: Each (ea) or Package
Flower Packaging (Ready for Sale)
 Description: Packaged cannabis flower prepared for retail sale, labeled and sealed.
 UOM: Grams (g) or Ounces (oz)

There is going to be a single interface for all with different modules depending on user access level, this is to be determine at login, there is not need to present UBI#

Parent location main identifier (UBI)
Child locations - Main identifier (License #), License type
Each location will be categorized by a License Type:
Cultivator
Manufacturer
Cultivator/Manufacturer
Retail
Full Vertical
Testing Laboratory
These license types will determine the Modules enabled in each location
Here are the default license types and modules:
Cultivator will have the following Modules
Cultivation Module
Inventory Module
Testing Module
Transfer Module
Licensee Reporting Module
Manufacturers will have the following Modules
Inventory Module
Conversion Module
Testing Module (for sample generation)
Transfer Module
Licensee Reporting Module
Cultivator/Manufacturer will have the following Modules
Cultivation Module
Inventory Module
Conversion Module
Testing Module (for sample generation)
Transfer Module
Licensee Reporting Module
Retail will have the following Modules
Retail Module
Inventory Module
Conversion Module
Testing Module (for sample generation)
Transfer Module
Licensee Reporting Module
Full Vertical will have the following Modules
Cultivation Module
Retail Module
Inventory Module
Conversion Module
Testing Module (for sample generation)
Transfer Module
Licensee Reporting Module
Testing Laboratory will have the following Modules
Lab Module (for entering results)
Define Licensee Modules and Functionality:

Licensee User Management Global Module per UBI
This module can only be accessed by admin level licensee users within a given UBI
This is for administrative purposes within a UBI, they must be able to manage their own users, create/modify/activate/deactivate as well as level of access
Cultivation Module - This is where plants are stored
Functionality include:
New Plant
There will be 3 ways to bring in new plants
Via a Source Inventory (in the Inventory window)
Source inventory types Clones, Seed
Via Inbound Transfer (Transfer Module)
Via “Initial Window” this is a permission enabled by the State at the license location level which gives the location granted the permission the ability to generate new plants without a transfer, and without a source.
Plant Details
Here users would be able to inspect a single plant and view all of its properties such as:
Strain name
Birthday
Phase
Status
Action history (any actions taken on that plant)
Plant Inbound and Outbound transfers (Utilizes Transfer Module)
This is for wholesale purposes, if a cultivator wants to wholesale plants to another cultivator.
There are two types of Plant Transfers
Sale Transfer - for wholesale to another UBI vendor’s location - must check that receiving vendor is of Cultivator License type
Same UBI Transfer - for when you are simply relocating plants to another one of your facilities - this must check to ensure the receiving location is within the same UBI, but still provide the ability to enter sales data as sometimes locations may have separate accounting. Meaning this transfer could be done as a sale, or it can be done for zero dollars.
Safeguard, must not allow plants that were previously harvested, or are part of an active harvest to be transferred.
This functionality uses the Transfer Module
Cultivation rooms
Move Plants between rooms
These are used to organize the plant inventory
They must have the ability to switch between rooms to view the different plants between rooms
Ability to create/modify/delete rooms
Safeguard, must not allow the deleting of a room containing plants
Harvest
Ability to harvest 1 plant, or multiple plants at a time
Every harvest whether single plant or multiple plants must generate harvest batch records.
Whole Plant Harvest
In this case the user only collects Wet Whole Plant weight (this does not generate inventory, instead it sets plant phase to drying, and plant stays in the cultivation) it waits to be cured.
Regular Harvest
User enters Wet Flower,Wet Trim,Fresh Frozen Flower,Fresh Frozen Trim, Waste
In this scenario all of the items collected will generate new inventory items, and plant will disappear since it was technically used for the harvest and change status to harvested for reporting purposes
Additional Collection Harvest 
user enters Wet Flower,Wet Trim,Fresh Frozen Flower,Fresh Frozen Trim, Waste
In this scenario all of the items collected will generate new inventory items, however the plant will not disappear, technically when doing additional collection the user only collects a portion of the plant.
	
Cure
Cure can only be done on plants previously harvested as Whole plant Harvest
User enters Dry Flower (Cured), Dry Trim, Cured Whole Plant, Bucked Flower, Smalls/Shake, Waste
In this scenario all of the items collected will generate new inventory items, and the plant will disappear since it was technically used for the cure and change status to cured for reporting purposes.
Ability to set plants to “Mother Plant” Status
This will allow these plants to be used as a ‘source” for the creation of Clones, Seeds, Plant Tissue.
Destruction of plant/s
Destruction must log waste, and reason for destruction
Logs must show the user that destroyed the item
Undo capabilities for actions such as:
Room Move
Harvest
Cure
Destruction


Inventory Module - This is where inventory is stored
Functionality included:
New Inventory
There will be 3 ways to bring in new inventory
Via a Mother plant
Using a mother plant to generate new Clones, Seed
Via Inbound Transfer (Transfer Module)
Via “Initial Window” this is a permission enabled by the State at the license location level which gives the location granted the permission the ability to generate new inventory without a transfer, and without a source, in this case any inventory type can be created.
Inventory Details
Here users would be able to inspect a single inventory item and view all of its properties such as:
Strain name
Available Quantity
Create Date
Status
Action history (any actions taken on that inventory item)
Usable weight (for finished goods)
Ability to change Product name
The product name is a sub categorization mechanism that allows users to give the item a custom detailed name 
Product name does not change inventory type
Products must have POS customization properties such as pricing, discounts, loyalty program
A Single product can have multiple inventory items under it
Product inventory type must match item inventory type in order to be linked.
Inventory rooms
Move Plants between rooms
These are used to organize the inventory items
They must have the ability to switch between rooms to view the different inventory items between rooms
Ability to create/modify/delete rooms
Safeguard must not allow the deletion of a room containing inventory items.
Inventory Inbound or Outbound Transfer (Utilizes Transfer Module)
This is for wholesale purposes, if a vendor wants to wholesale Inventory to another vendor.
There are two types of Inventory transfers
Sales Transfer - for wholesale to another UBI vendor’s location
Same UBI Transfer - for when you are simply relocating inventory to another one of your facilities - this must check to ensure the receiving location is within the same UBI, but still provide the ability to enter sales data as sometimes locations may have separate accounting. Meaning this transfer could be done as a sale, or it can be done for zero dollars.
Safeguard, must not allow inventory items that are part of an active transfer.
Inventory Conversion (Utilizes Conversion Module)
Ability to convert inventory items from inventory type to inventory type.
Inventory Adjustments
Ability to adjust inventory up or down
Always request for a reason as to why it’s being adjusted
When adjusting up, warn the user that this type of adjustment will be logged as a red flag so as to be very detailed in their reason to avoid compliance/regulatory fines.
Create Lot
Create lot will be the ability to lot wet/dry items
This functionality can be part of the (Conversion Module)
Destruction of Inventory
Destruction must log waste, and reason for destruction
Logs must show the user that destroyed the item
Inventory Testing (utilizes Testing Module (for sample generation))
This is to be able to create a sample from an item, assigned it to a Testing Laboratory
Inventory Split
Ability to split off quantity from an item to generate a new item of the same inventory type/characteristics/testing values (if present)
For traceability purposes we must track relation between Parent and child
New item must have a “sublot” identifier and cannot be further split
Inventory Combination
Ability to combine multiple items into a single item
Items must be the same inventory type
In the event it’s different strains, it must alert user to let it know the new item will automatically have “mixed strain” indicator
There are two types of inventory combination
Combine into exiting item
This is where 1 of the items in the combination will be set as the receiver of all the combination quantity
Combine into new item
This is where all items are combined into a brand new inventory item
Undo capabilities for actions such as:
Room Move
Inventory Split
Combination
Adjustments
Create Lot
Conversion
Destruction

Transfer Module
Functionality included:
Alert Mechanism
Alert when there is an inbound transfer
Alert when there is an outbound transfer
Alert when transfer has been received
On full acceptance
On partial acceptance
Alert when transfer has been voided/canceled
Alert when transfer has been rejected
Inbound Transfers
Intake process must be an item at a time, this is to reduce inventory discrepancies
There will be 3 intake options per item
Full acceptance
In this case the item item’s quantity is accepted
Partial Acceptance
In this case the user can accept a smaller quantity, in this case the receiver will take in the barcode sent with the quantity received and the difference goes back to send in the form of an inventory split, meaning they receive a newly generated barcode number.
Full reject
In this case the user rejects the entire item, and the same barcode along with the original quantity is sent back to the sender.
If intaking plants these must land in the Cultivation Module
User should be able to select exact cultivation room
If intaking inventory these must land in the Inventory Module
User should be able to select exact inventory room
Ability to enter purchase price per inventory item
Ability to reject entire manifest
If the receiver decides to not accept any of the items in the manifest
All items go back to the sender.
Outbound Transfer
For plants it must use the following rules:
There are two types of Plant Transfers
Sale Transfer - for wholesale to another UBI vendor’s location - must check that receiving vendor is of Cultivator License type
Same UBI Transfer - for when you are simply relocating plants to another one of your facilities - this must check to ensure the receiving location is within the same UBI, but still provide the ability to enter sales data as sometimes locations may have separate accounting. Meaning this transfer could be done as a sale, or it can be done for zero dollars.
Safeguard, must not allow plants that were previously harvested, or are part of an active harvest to be transferred.
For inventory items it must use the following rules:
There are two types of Inventory transfers
Sales Transfer - for wholesale to another UBI vendor’s location
Same UBI Transfer - for when you are simply relocating inventory to another one of your facilities - this must check to ensure the receiving location is within the same UBI, but still provide the ability to enter sales data as sometimes locations may have separate accounting. Meaning this transfer could be done as a sale, or it can be done for zero dollars.
Safeguard, must not allow inventory items that are part of an active transfer.
Ability to assign drivers, and vehicles to transfer
Ability to select the exact items to send along with the quantity to send out, since the system does not allow for barcode # duplication in the event an item with 50 units is selected but only transfer 25, the system must generate (using inventory split functionality) a new item (child) for 25 units and attach that to the manifest, it must keep traceability to the 
Generate purchase order and detailed manifest
Transfer must also transfer testing data for items with test results along with attached COAs (if any)
After an outbound transfer is generated, the items part of the transfer must have its status changed to “Transfer initiated” to then “in transit” once the items go out the door.
Ability to void this transfer so long as it has not been received.
If item has already been received then the only way to get the items back is via an outbound transfer from where the items are located

Conversion Module
Functionality included:
Handle all conversion aspects
Ability to convert inventory from inventory type to inventory type
To initiate a conversion the user must select the inventory type they want to convert to, the system must then display available inventory items that can be converted into the selected inventory type
There will be 3 types of conversions
1 to 1 conversion
This is when 1 item is used to convert into a single new item
Many to 1
This is where many items are used to convert into a single item
Many to Many
This is where many items are used to convert into many items
For this type of conversion the user will need to specify how many new items they are creating and the quantity per item

When converting to end products the user must enter the usable weight per unit of the item being created, there must be safeguard in place to throw warning if the usable is too high or too low depending on the inventory type, but default usable weight is calculated based on quantity of product introduced in the conversion divided by number of units created.

Retail Module
Functionality included:
POS
This is where users can load up patient profiles
Add items to cart
Apply discounts
Make sales
There will be 3 times of sales
Regular sale
This is a regular in person sale
Pick up sale
This is a sale where the patient picks up the item at a later time
This type of sale must reserve inventory once it’s made so that there are no inventory discrepancies
Delivery sale
This is a sale that will require the creation of a manifest in order to deliver the items to the patient
This type of sale must reserve inventory once it’s made so that there are no inventory discrepancies
Loyalty Program
Product Customization
Name
Category
Pricing structure
Discounts
The POS must have the ability to integrate into external patient portals to retrieve the patient allotment so that as items are added to the cart the user knows how much limits the patient has left (for testing purposes we could stage this, however there must be a mechanism in place to make the connection to the patient portal)
Ability to void sales
This can only be done if the sale is voided the same day it was made
May need admin 
Ability to refund sales
This can be done at any time
Restock is done at dispensaries discretion, usually if items are unused/unopened
Patient allotment restoration, if items are unused/unopened
Ability to refund per item
	
Licensee Reporting Module
Functionality included:
Here they should have a series of reports to match all the functionality available in the different Licensee Modules
Testing Module (for sample generation)
Functionality included:
This module allows users to select an item they would like to test and extract a QA sample from it.
Relation between Sample and Inventory item is done via the Sample Id column in the inventory table.
In the creation process depending on testing rules for the state, the panels will be automatically loaded depending on the inventory type being tested, or user may have to select the panels.
Sample is assigned to a lab
In conjunctions with Transfer Module the sample/s is/are transferred to the lab
There must be the ability to void the sample and transfer so long as it has not been received by the lab, if received by the lab the lab must be the one to cancel the sample on their end.
There must be detailed status
When an item is sampled - Change item status to “Sample Created”
When the sample is transferred - status: “Sample Transferred"
When lab received it, Status: “Sample Received”
If the lab received it Status “Rejected by lab”
In this case the sample item automatically goes back to the sender, they are able to then resent, or assign the sample to a different lab
When lab starts testing process “In process”
When the results are back
For pass testing “ Passed QA”
For failed testing “Failed QA”
Users must be able to view detailed testing information per item
There must be a remediation mechanism
This request goes into the State request approval Module
This is where the user sends a request to the State Module for a State official to approved/denied a retest on the product.
If approved - they can retest and send to lab (same or different)
If denied - the item must be destroyed
Lab Module (for entering results)
Functionality included:
Alert Mechanism
Alert when sample/s have been assigned to them
Alert when sample/s have been transferred to them
Lab Inbound Transfers
Intake process must be an item at a time, this is to reduce inventory discrepancies
There will be 2 intake options per item
Full acceptance
In this case the full item’s quantity is accepted
Full reject
In this case the user rejects the entire item, and the same barcode along with the original quantity is sent back to the sender.
Enter results
The lab must be able to enter results once the product has been tested, results will be stored in the sample, and link back to the item via sample id.
Define State Modules and Functionality:
State User Management Global Module
This is for administrative purposes within the State Module, they must be able to manage their own users, create/modify/activate/deactivate as well as level of access
State Dashboard Modules
State Dashboard and reporting Module
Functionality include:
This is a birds eye view of the entire market, with a series of reports highlighting the most relevant actions per licensee. As well as red flag actions.
There must be configurability capabilities in this dashboard at glace data could be changed around.
State Licensee Account Management Module
Functionality include:
The state will be in charge of creating new licensee locations, and managing these locations, activating and deactivating licensee account
Licensee will consist of the parent entity which will hold the different locations under it.
Within the licensee account management there must be a mechanism to enable the Initial Window.
State Reporting Module
Advanced whole market reporting capabilities. 
Ability to build custom reports
State request approval Module
Functionality include:
This module is where customer request from licenses will come in
For now the only custom request will be the one to request remediation on a failed lab sample.
More functionality will be added later.

	


Define System Admin Modules and Functionality:
System Customization Module
Functionality include:
Barcode format customization
There must be the ability to change the format of the barcode, some states are ok with the 16 digit, while other may prefer to have a format that include license number
Inventory types customization
Ability to modify inventory type name across entire system
Ability to add, or remove inventory types	
Transfer rules Customization
By default all items can be transferred across all license types
Which license types can transfer to which license types
Which inventory types can be transferred
Which testing status must items have in order to be transferred
Testing Rules Customization
Which testing panels are needed for which inventory type
Usable weight calculation customization
Additional information on what is usable weight, this is the amount the item will deduct from patient limits upon sale. Some states have a simple formula such as dividing number of grams by number of units on inventory conversions, while others incorporate testing data into the formula to generate equivalency deductions.
Location License Types
Location lice type names, and modules must be customizable


