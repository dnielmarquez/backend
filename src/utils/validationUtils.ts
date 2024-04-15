// Helper function to check if a value is within the specified range
export const isWithinRange = (value: number, min: number, max: number) => {
    return value >= min && value <= max;
};

// Function to determine the overall status based on validation results
export const determineOverallStatus = (machiningValidation: any[] | null | undefined, coatingValidation: any[] | null | undefined) => {
    // Check if all machining validations passed or if it's not applicable
    const allMachiningPassed = !machiningValidation || machiningValidation.every(item => item.validationStatus);

    // Check if all coating validations passed or if it's not applicable
    const allCoatingPassed = !coatingValidation || coatingValidation.every(batch =>
        batch.samples.every((sample: { validationStatus: any; }) => sample.validationStatus)
    );

    // If both validations are null, it's an automatic "Rejected" or adjust according to your business logic
    if (machiningValidation === null && coatingValidation === null) {
        return 'Rejected'; // or 'Pending', 'NotApplicable', etc.
    }

    // If all applicable validations passed, return "Accepted", otherwise "Rejected"
    return allMachiningPassed && allCoatingPassed ? 'Accepted' : 'Rejected';
};

// Helper function to validate machining data against product requirements
export const validateMachining = (machiningData: any[], requirements: {
    Scratches: string;
    Dented: string; LengthMin: number; LengthMax: number; ODMin: number; ODMax: number; IDMin: number; IDMax: number;
}) => {
    return machiningData.map((item: {
        scratches: boolean;
        dented: boolean; length: number; OD: number; ID: number;
    }) => {
        let comments: string[] = [];
        const lengthValid = isWithinRange(Number(item.length), Number(requirements.LengthMin), Number(requirements.LengthMax));
        if (!lengthValid) comments.push(`Length out of range (${requirements.LengthMin}-${requirements.LengthMax})`);
        const ODValid = isWithinRange(Number(item.OD), Number(requirements.ODMin), Number(requirements.ODMax));
        if (!ODValid) comments.push(`OD out of range (${requirements.ODMin}-${requirements.ODMax})`);
        const IDValid = isWithinRange(Number(item.ID), Number(requirements.IDMin), Number(requirements.IDMax));
        if (!IDValid) comments.push(`ID out of range (${requirements.IDMin}-${requirements.IDMax})`);
        if (item.scratches && requirements.Scratches === 'false') {
            comments.push(`Item should not have scratches`);
        }
        if (!item.scratches && requirements.Scratches === 'true') {
            comments.push(`Item should have scratches`);
        }
        if (item.dented && requirements.Dented === 'false') {
            comments.push(`Item should not be dented`);
        }
        if (!item.dented && requirements.Dented === 'true') {
            comments.push(`Item should be dented`);
        }
        return {
            ...item,
            validationStatus: comments.length === 0, // If there are no comments, validationStatus is true
            comments: comments.join('; ') // Combine all comments into a single string
        };
    });
};

// Helper function to validate coating data against product requirements
export const validateCoating = (coatingData: any[], requirements: {
    Porosity: string;
    ThicknessMin: number;
    ThicknessMax: number;
}) => {
    return coatingData.map((batch: { batchNumber: string; traceabilityNumbers: string[]; samples: any[]; }) => ({
        ...batch,
        samples: batch.samples.map((sample: { porosity: boolean; thickness: number; }) => {
            let comments: string[] = [];

            // Validate porosity
            const porosityValid = sample.porosity.toString() === requirements.Porosity;
            if (!porosityValid) comments.push(`Porosity should be ${requirements.Porosity}`);

            // Validate thickness
            const thicknessValid = isWithinRange(sample.thickness, requirements.ThicknessMin, requirements.ThicknessMax);
            if (!thicknessValid) comments.push(`Thickness out of range (${requirements.ThicknessMin}-${requirements.ThicknessMax})`);

            // Add more checks here as necessary

            return {
                ...sample,
                porosityValid,
                thicknessValid,
                validationStatus: comments.length === 0, // If there are no comments, validationStatus is true
                comments: comments.join('; ') // Combine all comments into a single string
            };
        })
    }));
};

