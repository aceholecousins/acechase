
// https://parmanoir.com/distance/

//
// 
// Distance
// 
// 

// Make a boolean image b from input canvas (1=foreground, 0=background)
function	booleanImageFromCanvas(canvas, threshold, negative)	{
	var m		= canvas.width
	var n		= canvas.height
	var data	= canvas.getContext('2d').getImageData(0, 0, m, n).data
	var infinity= (m+n)
	var idx		= 0
	var booleanImage	= new Array(m*n)
	for (var j=0; j<n; j++)	{
		for (var i=0; i<m; i++)	{
			var c = data[idx*4] < threshold ? 1 : 0
			booleanImage[idx] = negative ? 1-c : c
			idx++
		}
	}
	return booleanImage
}

// Meijster distance
//	method : 'EDT' (Euclidean) 'MDT' (Manhattan) 'CDT' (Chessboard)
//	Everything is integer math, hence Math.floor()
function	distanceFromBooleanImage(booleanImage, m, n, method) {
	// First phase
	var infinity = m+n
	var b = booleanImage
	var g = new Array(m*n)
	for (var x=0; x<m; x++)	{
		if (b[x+0*m])
			g[x+0*m] = 0
		else
			g[x+0*m] = infinity
		// Scan 1
		for (var y=1; y<n; y++)	{
			if (b[x+y*m])
				g[x+y*m] = 0
			else
				g[x+y*m] = 1 + g[x+(y-1)*m]
		}
		// Scan 2
		for (var y=n-1; y>= 0; y--)	{
			if (g[x+(y+1)*m] < g[x+y*m])
				g[x+y*m] = 1 + g[x+(y+1)*m]
		}
	}

	// Euclidean
	function EDT_f(x, i, g_i) {	
		return (x-i)*(x-i) + g_i*g_i	
	}
	function EDT_Sep(i, u, g_i, g_u) {	
		return Math.floor((u*u - i*i + g_u*g_u - g_i*g_i)/(2*(u-i)))	
	}

	// Manhattan
	function MDT_f(x, i, g_i) {	
		return Math.abs(x-i) + g_i		
	}
	function MDT_Sep(i, u, g_i, g_u) {
		if (g_u >= (g_i + u - i))
			return infinity
		if (g_i > (g_u + u - i))
			return -infinity
		return Math.floor((g_u - g_i + u + i)/2)
	}

	// Chessboard
	function CDT_f(x, i, g_i) {	
		return Math.max(Math.abs(x-i), g_i)	
	}
	function CDT_Sep(i, u, g_i, g_u) {
		if (g_i <= g_u)
			return Math.max(i+g_u, Math.floor((i+u)/2))
		else
			return Math.min(u-g_i, Math.floor((i+u)/2))
	}

	// Second phase
	var f	= eval(method + '_f')
	var Sep	= eval(method + '_Sep')
	var dt	= new Array(m*n)
	var s	= new Array(m)
	var t	= new Array(m)
	var q	= 0
	var w
	for (var y=0; y<n; y++)	{
		q = 0
		s[0] = 0
		t[0] = 0
		
		// Scan 3
		for (var u=1; u<m; u++)	{
			while (q >= 0 && f(t[q], s[q], g[s[q]+y*m]) > f(t[q], u, g[u+y*m]))
				q--
			if (q < 0)	{
				q = 0
				s[0] = u
			}	else	{
				w = 1 + Sep(s[q], u, g[s[q]+y*m], g[u+y*m])
				if (w < m)	{
					q++
					s[q] = u
					t[q] = w
				}
			}
		}
		// Scan 4
		for (u=m-1; u>=0; u--)	{
			var d = f(u, s[q], g[s[q]+y*m])
			if (method == 'EDT')		
				d = Math.floor(Math.sqrt(d))
			dt[u+y*m] = d
			if (u == t[q])
				q--
		}
	}
	return dt
}

//
// Distance painting - distances > 255 are clamped to 255
//
function	paintDistanceInCanvas(distance, canvas, isolines, settings) {
	var m			= canvas.width
	var n			= canvas.height
	var canvasImage	= canvas.getContext('2d').getImageData(0, 0, m, n)
	var data		= canvasImage.data

	var strokeWidth	= settings.stroke ? settings['stroke-width'] : 0
	var contrast	= settings.contrast/100
	var isolineColor= settings.isolineColor 
	var strokeColor	= settings.strokeColor
	var distanceColor	= { r : settings.distanceColor.r*contrast/255, g : settings.distanceColor.g*contrast/255, b : settings.distanceColor.b*contrast/255 }
	
	// Convert to visible
	var idx = 0
	for (var y=0; y<n; y++)	{
		for (var x=0; x<m; x++)	{
			var d = distance[idx]
			if (isolines[d] || (d && d <= strokeWidth))	{
				if (isolines[d])
					data[idx*4+0] = isolineColor.r, data[idx*4+1] = isolineColor.g, data[idx*4+2] = isolineColor.b
				else
					data[idx*4+0] = strokeColor.r, data[idx*4+1] = strokeColor.g, data[idx*4+2] = strokeColor.b
			}
			else
				data[idx*4+0] = Math.min(255, d*distanceColor.r), data[idx*4+1] = Math.min(255, d*distanceColor.g), data[idx*4+2] = Math.min(255, d*distanceColor.b)

			idx++		
		}
	}
	canvas.getContext('2d').putImageData(canvasImage, 0, 0)
	
	// Reveal distance shape
	if (settings.revealShape) {
		var ctx = canvas.getContext('2d')
		ctx.fillStyle	= 'rgba(255, 0, 0, 0.2)'
		ctx.strokeStyle	= 'rgba(255, 0, 0, 1)'
		var d = distance[settings.revealX+settings.revealY*canvas.width]
		var x = settings.revealX
		var y = settings.revealY
		if (settings.method == 'EDT') {
			ctx.beginPath() 
			ctx.arc(x, y, d, 0, Math.PI*2, true)
			ctx.closePath()
			ctx.fill()
			ctx.stroke()
		}
		if (settings.method == 'MDT') {
			ctx.beginPath() 
			ctx.moveTo(x, y-d)
			ctx.lineTo(x+d, y)
			ctx.lineTo(x, y+d)
			ctx.lineTo(x-d, y)
			ctx.lineTo(x, y-d)
			ctx.closePath()
			ctx.fill()
			ctx.stroke()
		}
		if (settings.method == 'CDT') {
			ctx.fillRect(x-d, y-d, d*2, d*2)
			ctx.strokeRect(x-d, y-d, d*2, d*2)
		}
		// Crosshair
		ctx.strokeRect(x-5, y, 10, 0)
		ctx.strokeRect(x, y-5, 0, 10)
	}
}
