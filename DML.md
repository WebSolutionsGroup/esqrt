For Custom Records, this is a statement you would execute in the query window, and it would translate the statements just like the CREATE PROCEDURE and CREATE FUNCTION statements, executing the necessary SuiteScript APIs to create the custom record.

CREATE RECORD employee_history (
    id "_sqrt_employee_history", -- This would be appended to the prefix "customrecord_" to form the final record ID
    firstname FREEFORMTEXT,
    lastname FREEFORMTEXT,
    email EMAILADDRESS,
    hiredate DATE,
    salary CURRENCY,
    department LIST(department),
    subsidiary LIST(subsidiary)
);

The above was just an example, but would utilize the same field types as the standard NetSuite custom records (see below for reference)

Field Type,Description,Limitations
Check Box,"Records a true/false value (checked or unchecked). Used for binary choices like ""Active"" or ""Approved"".",None specific; displays as a checkbox.
Currency,Stores monetary values with support for multiple currencies if enabled. Behaves differently from standard currency fields (not hidden without Multi-Currency feature).,"Up to 15 digits before the decimal and 15 after (e.g., 999,999,999,999,999.999999999999999). Larger values round down."
Date,Stores a date value; users can enter or select from a calendar. Converting to Date/Time adds midnight time in the company's time zone.,No character limit; stored as date format.
Date/Time,Combines date and time (down to seconds) in one field; displays in user's preferred format and time zone. Use 'datetimetz' in SuiteScript.,No character limit; stored as datetime.
Decimal Number,Stores floating-point numbers.,Up to 20 digits total; larger values round down.
Document,"Allows selection of a file from the File Cabinet for attachment, preview, or download. Searchable. Requires File Cabinet access.",No character limit; limited to supported file types and user permissions.
Email Address,Stores an email address; clickable to open default email client.,Up to 254 characters.
Entity,"A special List/Record type for linking to entity records (e.g., customer, employee, vendor). Supports sourcing/filtering to limit options.",No character limit; options depend on selected entity types.
Free-Form Text,Basic text input for short strings. Common for names or IDs.,Up to 300 characters.
Help,Displays informational text on forms (not stored as data).,Up to 999 characters.
Hyperlink,"Stores a URL; clickable link. Must start with http://, https://, or ftp:// (file:// not recommended).",Up to 999 characters for URL; hyperlink display text up to 10 characters.
Image,Attaches an image from the File Cabinet; resizes to max 250px width on forms.,"Supported formats: .bmp, .gif, .jpg, .jpeg, .pjpg, .pjpeg, .png, .tiff, .tif. No character limit."
Inline HTML,Allows HTML code for custom display on forms or Suitelets. Not supported for DOM manipulation except in Suitelets.,"Up to 4,000 bytes (characters in English; fewer for non-English). Deprecated in new UI."
Integer Number,Stores whole numbers.,"Up to approximately 20 digits (e.g., 18,000,000,000,000,000,000); larger values affected by rounding."
List/Record,"Links to a list or another record type (e.g., saved searches, employees). Can include Advanced PDF/HTML Templates for printing.",No character limit; options filtered by list/record selected.
Long Text,Large text area for extensive unformatted text. Cannot revert after converting from Free-Form Text or Text Area.,"Up to 1,000,000 characters in UI; 100,000 via SuiteScript."
Multiple Select,Allows selecting multiple items from a list or record.,"Display in saved searches up to 4,000 characters; no hard input limit."
Password,"Encrypted text for secure storage (e.g., credentials). Displays fixed placeholders. Requires custom validation scripting.",Up to 15 characters.
Percent,Stores a percentage value; appends % symbol.,Integers from 0 to 100 only.
Phone Number,Stores telephone numbers.,Up to 32 characters.
Rich Text,"Text area with formatting (bold, italic, color, lists, etc.).","Up to 100,000 characters."
Text Area,Unformatted text area for medium-length input.,"Up to 4,000 characters."
Time of Day,Stores time values (hours/minutes).,No character limit; stored as time format.

Default Fields:
Name
Internal ID
External ID
Owner
Parent
Inactive
Last Modified

For Custom Lists, this is a statement you would execute in the query window, and it would translate the statements just like the CREATE PROCEDURE and CREATE FUNCTION statements, executing the necessary SuiteScript APIs to create the custom list.

CREATE LIST employeestatus (
    id "_sqrt_employeestatus", -- This would be appended to the prefix "customlist_" to form the final list ID
    description "Employee Status",
    optionsorder "ORDER_ENTERED",
    matrixoption TRUE,
    isinactive FALSE,
    values [
        {
            value "Active",
            abbreviation "A",
            inactive FALSE,
            translations [
                {
                    language "ES",
                    value "Activo"
                }
            ]
        },
        {
            value "Inactive",
            abbreviation "I",
            inactive FALSE,
            translations [
                {
                    language "ES",
                    value "Inactivo"
                }
            ]
        }
    ]
    
);