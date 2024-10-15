// src/components/DocumentPreview.js

import React from 'react';
import { Button, Image } from 'react-bootstrap';
import PropTypes from 'prop-types';


const DocumentPreview = ({ document, onView, pdfIcon }) => {
    return (
        <div className="d-flex align-items-center mb-3">
            {/* PDF Icon */}
            <Image
                src={pdfIcon}
                alt="PDF Icon"
                width={24}
                height={24}
                className="me-2"
            />

            {/* Document Name */}
            <span className="me-auto">{document.name}</span>

            {/* View Button */}
            <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onView(document.url)}
            >
                View
            </Button>
        </div>
    );
};

DocumentPreview.propTypes = {
    document: PropTypes.shape({
        name: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
    }).isRequired,
    onView: PropTypes.func.isRequired,
    pdfIcon: PropTypes.string.isRequired,
};

export default DocumentPreview;
