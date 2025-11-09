/**
 * Parse voice commands to extract actions and parameters
 * Example: "Navi update the font in this pdf then send it to John Doe over email"
 */
export function parseCommand(command) {
    const lowerCommand = command.toLowerCase();
    const result = {
        action: null,
        target: null,
        modifications: [],
        recipient: null,
        method: null,
        originalCommand: command,
    };

    // Extract PDF/document references - check for "this pdf", "the pdf", "that pdf"
    // This will be used to find the document in the documents array
    const pdfPatterns = [
        /(?:this|the|that)\s+(pdf|document|file)/i,
        /\b(pdf|document|file)\b/i,
    ];

    for (const pattern of pdfPatterns) {
        const match = command.match(pattern);
        if (match) {
            result.target = match[1] || 'pdf';
            break;
        }
    }

    // Also check for "it" which refers to the document (usually in the second part of chained commands)
    if (lowerCommand.includes(' send it ') || lowerCommand.includes(' send it to') || lowerCommand.endsWith(' send it')) {
        result.target = 'it';
    }

    // Extract actions - check for "then" first to handle chained commands
    const thenIndex = Math.max(
        lowerCommand.indexOf(' then '),
        lowerCommand.indexOf(' and then ')
    );

    let commandToParse = command;
    let secondPart = '';

    if (thenIndex > -1) {
        const splitIndex = thenIndex + (lowerCommand.includes('and then') ? 9 : 5);
        commandToParse = command.substring(0, thenIndex).trim();
        secondPart = command.substring(splitIndex).trim();
    }

    // Parse first part of command
    const lowerFirstPart = commandToParse.toLowerCase();

    if (lowerFirstPart.includes('update') || lowerFirstPart.includes('change') || lowerFirstPart.includes('modify') || lowerFirstPart.includes('edit')) {
        result.action = 'update';

        // Extract what to update
        if (lowerFirstPart.includes('font')) {
            result.modifications.push({ type: 'font', value: extractFontDetails(commandToParse) });
        }
        if (lowerFirstPart.includes('color') || lowerFirstPart.includes('colour')) {
            result.modifications.push({ type: 'color', value: extractColor(commandToParse) });
        }
        if (lowerFirstPart.includes('size')) {
            result.modifications.push({ type: 'size', value: extractSize(commandToParse) });
        }
    }

    // Parse second part if it exists (for chained commands like "update... then send...")
    if (secondPart) {
        const lowerSecondPart = secondPart.toLowerCase();

        if (lowerSecondPart.includes('send') || lowerSecondPart.includes('email') || lowerSecondPart.includes('mail')) {
            // If we already have an update action, this becomes update_and_send
            if (result.action === 'update') {
                result.action = 'update_and_send';
            } else {
                result.action = 'send';
            }
            result.method = 'email';

            // Extract recipient from second part - handle "send it to John Doe" or "send to John Doe"
            // More flexible pattern to catch names
            const recipientPatterns = [
                /(?:send\s+(?:it\s+)?to|email\s+(?:it\s+)?to|mail\s+(?:it\s+)?to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i,
                /to\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i,
                /([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)/, // Simple name pattern
            ];

            for (const pattern of recipientPatterns) {
                const match = secondPart.match(pattern);
                if (match) {
                    result.recipient = match[1].trim();
                    break;
                }
            }

            // Also check for email addresses
            const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
            const emailMatch = secondPart.match(emailPattern);
            if (emailMatch) {
                result.recipient = emailMatch[1].trim();
            }

            // Check for "over email" or "via email"
            if (lowerSecondPart.includes('over email') || lowerSecondPart.includes('via email') || lowerSecondPart.includes('by email')) {
                result.method = 'email';
            }
        }
    } else {
        // No chaining, check if send is in the main command
        if (lowerCommand.includes('send') || lowerCommand.includes('email') || lowerCommand.includes('mail')) {
            result.action = result.action ? 'update_and_send' : 'send';
            result.method = 'email';

            // Extract recipient - more flexible patterns
            const recipientPatterns = [
                /(?:send\s+(?:it\s+)?to|email\s+(?:it\s+)?to|mail\s+(?:it\s+)?to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i,
                /to\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i,
                /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            ];

            for (const pattern of recipientPatterns) {
                const match = command.match(pattern);
                if (match) {
                    result.recipient = match[1].trim();
                    break;
                }
            }
        }
    }

    return result;
}

/**
 * Extract font details from command
 */
function extractFontDetails(command) {
    // Try multiple patterns to catch different ways of specifying fonts
    const fontPatterns = [
        /font\s+(?:to\s+)?([a-zA-Z\s]+?)(?:\s+in|$|,|\.|then|and)/i,
        /(?:change|update|set)\s+font\s+(?:to\s+)?([a-zA-Z\s]+?)(?:\s+in|$|,|\.|then|and)/i,
        /font\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
    ];

    for (const pattern of fontPatterns) {
        const match = command.match(pattern);
        if (match && match[1]) {
            const fontName = match[1].trim();
            // Filter out common words that aren't font names
            if (!['the', 'this', 'that', 'in', 'to', 'a', 'an'].includes(fontName.toLowerCase())) {
                return fontName;
            }
        }
    }
    return 'Arial'; // Default font if none specified
}

/**
 * Extract color from command
 */
function extractColor(command) {
    const colorPattern = /(?:color|colour)\s+(?:to\s+)?([a-zA-Z]+?)(?:\s|$|,|\.|then|and)/i;
    const match = command.match(colorPattern);
    if (match) {
        return match[1].trim();
    }
    return null;
}

/**
 * Extract size from command
 */
function extractSize(command) {
    const sizePattern = /size\s+(?:to\s+)?(\d+)/i;
    const match = command.match(sizePattern);
    if (match) {
        return parseInt(match[1]);
    }
    return null;
}

/**
 * Execute parsed command
 */
export async function executeCommand(parsedCommand, documents, onProgress) {
    // Handle update_and_send action (chained command)
    if (parsedCommand.action === 'update_and_send') {
        // First update the document
        const updateResult = await updateDocument(parsedCommand, documents, onProgress);

        if (!updateResult.success) {
            return [updateResult];
        }

        // Then send the updated document
        const sendCommand = {
            ...parsedCommand,
            target: updateResult.modifiedFile || parsedCommand.target,
            action: 'send',
        };

        const sendResult = await sendDocument(sendCommand, documents, onProgress);

        return [updateResult, sendResult];
    }

    // Handle single actions
    const result = await executeAction(parsedCommand, documents, onProgress);
    return [result];
}

/**
 * Execute a single action
 */
async function executeAction(command, documents, onProgress) {
    if (command.action === 'update') {
        return await updateDocument(command, documents, onProgress);
    } else if (command.action === 'send') {
        return await sendDocument(command, documents, onProgress);
    }

    // If no action, return a helpful message
    if (!command.action) {
        return {
            success: false,
            message: 'I didn\'t understand that command. Try saying something like "update the font in this pdf" or "send this document to John Doe".'
        };
    }

    return { success: false, message: 'Unknown action' };
}

/**
 * Update document (mock implementation - replace with actual PDF manipulation)
 */
async function updateDocument(command, documents, onProgress) {
    onProgress?.('Processing document...');

    // Find the target document - look for PDF files first, then any document
    let targetDoc = documents.find(doc =>
        doc.name.toLowerCase().endsWith('.pdf') &&
        (command.target ? doc.name.toLowerCase().includes(command.target.toLowerCase()) : true)
    );

    // If no PDF found, get the most recently added document
    if (!targetDoc && documents.length > 0) {
        targetDoc = documents.sort((a, b) =>
            new Date(b.addedAt) - new Date(a.addedAt)
        )[0];
    }

    if (!targetDoc) {
        return { success: false, message: 'No document found. Please add a document first.' };
    }

    onProgress?.('Applying modifications...');

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, you would:
    // 1. Use a PDF library (like pdf-lib) to modify the PDF
    // 2. Apply font changes, color changes, etc.
    // 3. Save the modified PDF
    // 4. For font changes: pdfDoc.setFont(fontName)
    // 5. For color changes: pdfDoc.setFillColor(color)

    const modificationsText = command.modifications.length > 0
        ? command.modifications.map(m => {
            if (m.type === 'font' && m.value) {
                return `font to ${m.value}`;
            } else if (m.type === 'color' && m.value) {
                return `color to ${m.value}`;
            } else if (m.type === 'size' && m.value) {
                return `size to ${m.value}pt`;
            }
            return m.type;
        }).join(', ')
        : command.action === 'update' ? 'changes' : 'modifications';

    return {
        success: true,
        message: `Updated ${targetDoc.name}: Applied ${modificationsText}.`,
        modifiedFile: targetDoc.path,
        modifications: command.modifications,
    };
}

/**
 * Send document via email (mock implementation - replace with actual email sending)
 */
async function sendDocument(command, documents, onProgress) {
    onProgress?.('Preparing email...');

    // Find the target document - use the modified file if available, otherwise find the most recent PDF
    let targetDoc = command.target
        ? documents.find(doc => doc.path === command.target)
        : documents.find(doc => doc.name.toLowerCase().endsWith('.pdf'));

    // If still no document found, use the most recently added one
    if (!targetDoc && documents.length > 0) {
        targetDoc = documents.sort((a, b) =>
            new Date(b.addedAt) - new Date(a.addedAt)
        )[0];
    }

    if (!targetDoc) {
        return { success: false, message: 'No document found to send. Please add a document first.' };
    }

    if (!command.recipient) {
        return { success: false, message: 'Please specify a recipient (e.g., "send to John Doe")' };
    }

    onProgress?.(`Sending to ${command.recipient}...`);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real implementation, you would:
    // 1. Use an email service (like nodemailer, SendGrid, etc.)
    // 2. Attach the document file
    // 3. Send the email to the recipient
    // 4. Handle email addresses and contact name resolution

    return {
        success: true,
        message: `Sent ${targetDoc.name} to ${command.recipient} via email.`,
        recipient: command.recipient,
        document: targetDoc.name,
    };
}

