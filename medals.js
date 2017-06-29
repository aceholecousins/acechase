

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

	if(map == "maps/shootingrange1.svg"){
		if(score >= 20){return "diamond";}
		if(score >= 17){return "gold";}
		if(score >= 15){return "silver";}
		if(score >= 13){return "bronze";}
	}

	if(map == "maps/shootingrange2.svg"){
		if(score >= 16){return "diamond";}
		if(score >= 13){return "gold";}
		if(score >= 11){return "silver";}
		if(score >= 9){return "bronze";}
	}

	return null;

}
