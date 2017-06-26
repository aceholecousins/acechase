

function medal(map, score){

	if(map == "maps/cactus.svg"){
		if(score <= 15){return "diamond";}
		if(score <= 16){return "gold";}
		if(score <= 18){return "silver";}
		if(score <= 20){return "bronze";}
	}

	if(map == "maps/hilbertsgarden.svg"){
		if(score <= 15){return "diamond";}
		if(score <= 16){return "gold";}
		if(score <= 18){return "silver";}
		if(score <= 20){return "bronze";}
	}

	if(map == "maps/shootingrange.svg"){
		if(score >= 20){return "diamond";}
		if(score >= 16){return "gold";}
		if(score >= 13){return "silver";}
		if(score >= 10){return "bronze";}
	}

	return null;

}
