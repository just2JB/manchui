import React from "react";

const AdminRecommendRowSkeleton = () => (
  <tr className="adminRecommend__skRow" aria-hidden="true">
    <td>
      <span className="adminRecommend__sk adminRecommend__sk--title" />
    </td>
    <td>
      <span className="adminRecommend__sk adminRecommend__sk--short" />
    </td>
    <td>
      <span className="adminRecommend__sk adminRecommend__sk--tags" />
    </td>
    <td>
      <span className="adminRecommend__sk adminRecommend__sk--link" />
    </td>
    <td>
      <span className="adminRecommend__sk adminRecommend__sk--num" />
    </td>
    <td>
      <div className="adminRecommend__skActions">
        <span className="adminRecommend__sk adminRecommend__sk--btn" />
        <span className="adminRecommend__sk adminRecommend__sk--btn" />
      </div>
    </td>
  </tr>
);

export default AdminRecommendRowSkeleton;
