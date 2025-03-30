
import React from 'react';

const SupportedFileTypes = () => {
  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-2">Supported File Types</h2>
      <p className="text-muted-foreground mb-4">
        Upload compressed code packages in any of the following formats:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-secondary p-4 rounded-lg text-center">
          <span className="font-medium">.zip</span>
        </div>
        <div className="bg-secondary p-4 rounded-lg text-center">
          <span className="font-medium">.rar</span>
        </div>
        <div className="bg-secondary p-4 rounded-lg text-center">
          <span className="font-medium">.7z</span>
        </div>
      </div>
    </div>
  );
};

export default SupportedFileTypes;
