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
	return setList

	
def stringify(L):
	result = ""
	for elem in L:
		result += str(elem)
	return result	
		

def choose(n,k):
	return math.factorial(n)/(math.factorial(k)*math.factorial(n-k))

def greedyPwdRecover(n,k):
	fives = [set(i) for i in getSubsets(n,k)]
	sixes = [set(i) for i in getSubsets(n,k+1)]
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
	temp = [i for i in fives]
	for T in temp:
		if T.issubset(S):
			fives.remove(T)

def testGreedy():
	pwdSet = getSubsets(10,7)[random.randint(0,choose(10,7)-1)]
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


#print testGreedy()

# print choose(10,5)
"""
print (greedyPwdRecover())
print len(greedyPwdRecover())
# print choose(10,6)
print getSubsets(6,4)
"""
"""
fives = [set(i) for i in getSubsets(6,3)]
sixes = [set(i) for i in getSubsets(6,4)]
print "len: ", len(fives)
print impact([1,2,3,4],fives)
deleteSubsets([1,2,3,4],fives)
print "deleted"
print fives
print choose(6,3) - len(fives)
print impact([2,4,5,6],fives)
"""
print greedyPwdRecover(6,3)
