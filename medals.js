

function medal(map, time){

	if(map == "maps/hilbertsgarden.svg"){
		if(time <= 15){return "diamond";}
		if(time <= 16){return "gold";}
		if(time <= 17){return "silver";}
		if(time <= 18){return "bronze";}
	}

	return null;

}
