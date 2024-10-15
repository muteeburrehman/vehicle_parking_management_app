import React from 'react';
import { Row, Col, Image } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';

const DocumentPreviewRow = ({ documentPreviews, handleViewDocument, handleRemoveDocument, pdfIcon }) => {
  return (
    <Row className="mt-3">
      {documentPreviews.map((preview, index) => (
        <Col key={index} xs={12} md={4} className="mb-3 text-center">
          <div className="position-relative d-inline-block">
            <Image
              src={preview.name.endsWith('.pdf') ? pdfIcon : preview.src}
              alt="Document Preview"
              thumbnail
              onClick={() => handleViewDocument(index)}
              className="document-preview"
              style={{ width: '60px', height: '60px', cursor: 'pointer' }}
            />
            <FaTimes
              onClick={() => handleRemoveDocument(index)}
              className="position-absolute top-0 end-0 text-danger"
              style={{ cursor: 'pointer', fontSize: '18px', transform: 'translate(50%, -50%)' }}
            />
          </div>
          <div className="mt-2">
            <small>{preview.name}</small>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default DocumentPreviewRow;
