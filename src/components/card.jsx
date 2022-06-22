import React from 'react';
import './card.css';

const Card = ({ group, isSelected, onClick }) => {
  return (
    <div className={isSelected ? 'card selected' : 'card'} onClick={onClick}>
      <p className="name">{group.groupName}</p>
    </div>
  );
};

export default Card;
