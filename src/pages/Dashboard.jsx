import { useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const Dashboard = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome to the Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-950">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Card Title</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This is a sample card component that demonstrates the layout.
          </p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Open Modal
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-950">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Another Card</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Content goes here. You can add any information you want.
          </p>
          <Button variant="secondary">Learn More</Button>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-950">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Third Card</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            More content to showcase the grid layout.
          </p>
          <Button variant="outline">View Details</Button>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        onConfirm={() => {
          console.log('Confirmed!');
          setShowModal(false);
        }}
        confirmText="Confirm Action"
      >
        <p className="text-gray-900 dark:text-gray-100">This is an example modal dialog. You can put any content here.</p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Click confirm to close this modal.</p>
      </Modal>
    </div>
  );
};

export default Dashboard;
