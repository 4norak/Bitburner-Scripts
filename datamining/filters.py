def _exists_filter(iterable, filter_fun):
    return filter(lambda i: i is not None and filter_fun(i), iterable)

def _leveling(augs):
    return filter(lambda a: any(_exists_filter([a.hacking,
                                                a.hacking_exp,
                                                a.hacking_chance,
                                                a.hacking_speed],
                                               lambda i: i > 1)), augs)


def _money(augs):
    return filter(lambda a: any(_exists_filter([a.hacking_chance,
                                                a.hacking_speed,
                                                a.hacking_money,
                                                a.hacking_grow,
                                                a.crime_money,
                                                a.crime_success,
                                                a.work_money,
                                                a.hacknet_node_money],
                                               lambda i: i > 1)), augs)


def _skill(augs, skill):
    return filter(lambda a: any(_exists_filter([getattr(a, skill),
                                                getattr(a, f"{skill}_exp")],
                                               lambda i: i > 1)), augs)


class Filters:
    leveling = _leveling
    money = _money
    skill = _skill
