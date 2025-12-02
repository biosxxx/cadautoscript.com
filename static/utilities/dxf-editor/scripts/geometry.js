import {state} from './state.js';

export function createGeometry(canvas) {
  function screenToWorld(sx, sy) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      x: (sx - cx - state.offset.x) / state.scale,
      y: -(sy - cy - state.offset.y) / state.scale,
    };
  }

  function worldToScreen(wx, wy) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      x: wx * state.scale + state.offset.x + cx,
      y: -wy * state.scale + state.offset.y + cy,
    };
  }

  function dist(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  function distanceToSegment(p, v, w) {
    const l2 = dist(v, w) ** 2;
    if (l2 === 0) {
      return dist(p, v);
    }
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = {x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y)};
    return dist(p, projection);
  }

  function applyAngleSnap(start, end) {
    if (!state.snap.angle) {
      return {pos: end};
    }
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) {
      return {pos: end};
    }
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;
    const snapped = Math.round(angleDeg / state.snap.angle) * state.snap.angle;
    const rad = (snapped * Math.PI) / 180;
    return {
      pos: {
        x: start.x + len * Math.cos(rad),
        y: start.y + len * Math.sin(rad),
      },
      angle: snapped % 360,
    };
  }

  function getLineLineIntersection(p1, p2, p3, p4) {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0) return null;
    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y),
      };
    }
    return null;
  }

  function getLineCircleIntersect(p1, p2, circle) {
    const {center, radius} = circle;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return [];
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    const points = [];
    if (t1 >= 0 && t1 <= 1) {
      points.push({x: p1.x + t1 * dx, y: p1.y + t1 * dy});
    }
    if (t2 >= 0 && t2 <= 1) {
      points.push({x: p1.x + t2 * dx, y: p1.y + t2 * dy});
    }
    return points;
  }

  return {
    screenToWorld,
    worldToScreen,
    dist,
    distanceToSegment,
    applyAngleSnap,
    getLineLineIntersection,
    getLineCircleIntersect,
  };
}
