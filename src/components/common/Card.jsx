import React from 'react';
import './Card.css';


const Card = ({ title, subtitle, children, className = '', ...props }) => {
return (
<div className={`app-card ${className}`} {...props}>
<div className="app-card-inner">
{(title || subtitle) && (
<div className="app-card-header">
{title && <h3 className="app-card-title">{title}</h3>}
{subtitle && <p className="app-card-subtitle">{subtitle}</p>}
</div>
)}


<div className="app-card-body">{children}</div>
</div>
</div>
);
};


export default Card;