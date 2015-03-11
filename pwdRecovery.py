import copy
import math
import random

def getSubsets(n,k):
	piles = n-k+1
	setList = [[i] for i in xrange(1,piles+1)]
	while len(setList[-1]) < k:
		auxList = []
		for subset in setList:
			for i in xrange(subset[-1]+1,n+1):
				a = copy.copy(subset) + [i]
				auxList += [a]
		setList = auxList
	assert(len(setList) == choose(n,k))
	return setList

def choose(n,k):
	return math.factorial(n)/(math.factorial(k)*math.factorial(n-k))

def greedyPwdRecover():
	fives = [set(i) for i in getSubsets(10,5)]
	sixes = [set(i) for i in getSubsets(10,6)]
	#want to loop through all the sixes and figure out which of those has
	#the greatest number of subsets in fives
	greedySubs = []
	while len(fives) > 0:
		maxImpact = 0
		maxS = None
		for S in sixes:
			if maxS == None: maxS = S
			if impact(S,fives) > maxImpact:
				maxImpact = impact(S,fives)
				maxS = S
		greedySubs += [maxS]
		deleteSubsets(maxS,fives)
	return greedySubs

def impact(S,fives):
	numOfSubsets = 0
	for T in fives:
		if T.issubset(S):
			numOfSubsets += 1
	return numOfSubsets

def deleteSubsets(S,fives):
	for T in fives:
		if T.issubset(S):
			fives.remove(T)

def testGreedy():
	pwdSet = getSubsets(10,5)[random.randint(0,choose(10,5)-1)]
	random.shuffle(pwdSet)
	# public = pwdSet[:-1]
	# print sorted(public) in getSubsets(10,5)
	# public = set(public)
	pwdSet = set(pwdSet)
	index = 0
	for S in greedyPwdRecover():
		if pwdSet.issubset(S):
			return index
		else: index += 1
	return index


# print testGreedy()

# print choose(10,5)

print len(greedyPwdRecover())
# print choose(10,6)






	
