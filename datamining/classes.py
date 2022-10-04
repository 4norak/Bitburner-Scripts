class Storage:
    def __init__(self, **kwargs):
        self.__dict__ = kwargs

    def __getattr__(self, name, /):
        return None

    def __repr__(self):
        return "\n".join(f"{k}: {v}" for k,v in self.__dict__.items())

Augmentation = Storage


class EchoClass:
    def __getattribute__(self, name, /):
        return name

FactionNames = EchoClass()
AugmentationNames = EchoClass()


class ProgramFactory:
    def __getattribute__(self, name, /):
        return Storage(name = name)

Programs = ProgramFactory()
